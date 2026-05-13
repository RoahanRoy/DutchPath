@AGENTS.md

## UI Language
The profile page UI must be entirely in English. The app teaches Dutch, but all interface labels, buttons, section headers, and status text should be English.

Achievement titles come from the Supabase `achievements` table (stored in Dutch). The `ACHIEVEMENT_TITLES` map in `app/(app)/profile/profile-client.tsx` translates them by `key` — update this map if new achievements are added.

## Text-to-Speech
All listening audio uses Google Cloud TTS **Chirp3-HD** voices (Dutch: `nl-NL-Chirp3-HD-Charon` (male), `nl-NL-Chirp3-HD-Kore` (female A), `nl-NL-Chirp3-HD-Leda` (female B)). Do not introduce Wavenet, Neural2, or Standard voices in new seed scripts or audio generation paths. Chirp3-HD rejects SSML and the `pitch` parameter — `scripts/generate-listening-audio.ts` already handles this; preserve that behavior.
