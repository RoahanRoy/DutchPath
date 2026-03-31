@AGENTS.md

## UI Language
The profile page UI must be entirely in English. The app teaches Dutch, but all interface labels, buttons, section headers, and status text should be English.

Achievement titles come from the Supabase `achievements` table (stored in Dutch). The `ACHIEVEMENT_TITLES` map in `app/(app)/profile/profile-client.tsx` translates them by `key` — update this map if new achievements are added.
