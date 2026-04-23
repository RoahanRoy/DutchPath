/**
 * Generates Dutch audio for listening_tasks via Google Cloud TTS, uploads to
 * Supabase Storage, writes audio_url + audio_duration_seconds back to the row.
 *
 * Run: pnpm generate:listening-audio            # only rows with audio_url IS NULL
 *      pnpm generate:listening-audio -- --force # regenerate everything
 *
 * Env:
 *   GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...  (NEVER expose this to the app)
 *
 * Dialogues: each turn synthesized separately; MP3 buffers concatenated with
 * ffmpeg (stream copy) to preserve per-speaker voice + pacing. Install ffmpeg
 * on the host (brew install ffmpeg). Short silences between turns are added
 * via SSML <break> on the preceding turn.
 */

import { createClient } from "@supabase/supabase-js";
import textToSpeech, { protos } from "@google-cloud/text-to-speech";
import ffmpeg from "fluent-ffmpeg";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";

// Ensure fluent-ffmpeg finds the binaries even when Node's PATH lacks
// Homebrew (e.g. launched from GUI or non-login shells).
const FFMPEG_CANDIDATES = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"];
const FFPROBE_CANDIDATES = ["/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe", "/usr/bin/ffprobe"];
const ffmpegPath = process.env.FFMPEG_PATH ?? FFMPEG_CANDIDATES.find((p) => existsSync(p));
const ffprobePath = process.env.FFPROBE_PATH ?? FFPROBE_CANDIDATES.find((p) => existsSync(p));
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

type VoiceTurn = {
  speaker: string;
  voice: string;
  text: string;
  speakingRate?: number;
  pitch?: number;
  pauseAfterMs?: number;
};
type VoiceConfig =
  | { mode: "single"; voice: string; speakingRate?: number; pitch?: number }
  | { mode: "dialogue"; turns: VoiceTurn[] };

const FORCE = process.argv.includes("--force");
const BUCKET = "listening-audio";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});
const tts = new textToSpeech.TextToSpeechClient();

type AudioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding;
const MP3: AudioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.MP3;

async function synthesize(text: string, voice: string, rate = 0.9, pitch = 0): Promise<Buffer> {
  const [response] = await tts.synthesizeSpeech({
    input: text.startsWith("<speak>") ? { ssml: text } : { text },
    voice: { languageCode: "nl-NL", name: voice },
    audioConfig: {
      audioEncoding: MP3,
      speakingRate: rate,
      pitch,
      sampleRateHertz: 24000,
    },
  });
  if (!response.audioContent) throw new Error("No audio returned");
  return Buffer.from(response.audioContent as Uint8Array);
}

async function concatMp3s(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 1) return buffers[0];
  const dir = await mkdtemp(path.join(tmpdir(), "dp-tts-"));
  try {
    const paths: string[] = [];
    for (let i = 0; i < buffers.length; i++) {
      const p = path.join(dir, `${i}.mp3`);
      await writeFile(p, buffers[i]);
      paths.push(p);
    }
    const listFile = path.join(dir, "list.txt");
    await writeFile(listFile, paths.map((p) => `file '${p}'`).join("\n"));
    const out = path.join(dir, "out.mp3");
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .output(out)
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function probeDuration(buf: Buffer): Promise<number> {
  const dir = await mkdtemp(path.join(tmpdir(), "dp-probe-"));
  try {
    const p = path.join(dir, "in.mp3");
    await writeFile(p, buf);
    const meta = await new Promise<{ format: { duration?: number } }>((resolve, reject) => {
      ffmpeg.ffprobe(p, (err, data) => (err ? reject(err) : resolve(data as { format: { duration?: number } })));
    });
    return Math.round(meta.format.duration ?? 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function wrapWithPause(text: string, pauseMs: number): string {
  if (!pauseMs) return text;
  return `<speak>${text}<break time="${pauseMs}ms"/></speak>`;
}

async function buildDialogue(turns: VoiceTurn[]): Promise<{ buffer: Buffer; chars: number }> {
  const parts: Buffer[] = [];
  let chars = 0;
  for (const turn of turns) {
    const text = turn.pauseAfterMs ? wrapWithPause(turn.text, turn.pauseAfterMs) : turn.text;
    chars += turn.text.length;
    const buf = await synthesize(text, turn.voice, turn.speakingRate ?? 0.9, turn.pitch ?? 0);
    parts.push(buf);
  }
  return { buffer: await concatMp3s(parts), chars };
}

async function main() {
  let query = supabase.from("listening_tasks").select("id, level, week, voice_config, transcript_nl, audio_url");
  if (!FORCE) query = query.is("audio_url", null);
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as {
    id: number; level: string; week: number; voice_config: VoiceConfig; transcript_nl: string; audio_url: string | null;
  }[];
  console.log(`Found ${rows.length} tasks to process${FORCE ? " (force)" : ""}.`);

  let totalChars = 0;

  for (const row of rows) {
    const cfg = row.voice_config;
    try {
      let audio: { buffer: Buffer; chars: number };
      if (cfg.mode === "single") {
        const buf = await synthesize(row.transcript_nl, cfg.voice, cfg.speakingRate ?? 0.9, cfg.pitch ?? 0);
        audio = { buffer: buf, chars: row.transcript_nl.length };
      } else {
        audio = await buildDialogue(cfg.turns);
      }
      totalChars += audio.chars;

      const duration = await probeDuration(audio.buffer);
      const storagePath = `${row.level}/week-${row.week}/${row.id}.mp3`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, audio.buffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("listening_tasks")
        .update({ audio_url: publicUrl, audio_duration_seconds: duration })
        .eq("id", row.id);
      if (updErr) throw updErr;

      console.log(`✓ task ${row.id}  ${duration}s  ${publicUrl}`);
    } catch (e) {
      console.error(`✗ task ${row.id} failed:`, e);
    }
  }

  console.log(`\nDone. Synthesized ~${totalChars} chars (free tier: 1M WaveNet/month).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
