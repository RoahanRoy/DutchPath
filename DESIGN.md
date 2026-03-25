# DutchPath Design System

> Extracted from Google Stitch exports (dashboard, lesson_map, lesson_player, vocabulary_review, profile)

---

## 1. Creative Direction: "The Modern Scholastic"

A high-end editorial experience — not a gamified toy. Dutch functionalism (De Stijl) meets Linear-style productivity UI.

**Core Principles:**

- **"No-Line" Philosophy** — Never use 1px borders to separate sections. All containment is achieved through tonal background shifts.
- **Warm Paper Feel** — Background is warm off-white `#f9f9f7`, never pure white. Text is `#1a1c1b`, never pure black.
- **Dual-Spirit Typography** — UI in Plus Jakarta Sans (geometric, confident). Dutch content in Noto Serif (elegant, authoritative).
- **Tonal Layering** — Elevation via ambient background stacking, not drop shadows. Shadows only on floating elements.
- **"The Dutch Gap"** — Generous whitespace everywhere. If you think there's enough space, add 1rem more.

---

## 2. Color Palette (Material Design 3 Tokens)

### Primary (Dutch Royal Blue)

| Token                        | Hex       | Tailwind Class                | Usage                                  |
| ---------------------------- | --------- | ----------------------------- | -------------------------------------- |
| `primary`                    | `#002975` | `text-primary` `bg-primary`   | Core brand, CTAs, active nav           |
| `primary-container`          | `#003da5` | `bg-primary-container`        | Button gradient bottom, level badges   |
| `primary-fixed`              | `#dbe1ff` | `bg-primary-fixed`            | Highlighted Dutch words in passages    |
| `primary-fixed-dim`          | `#b4c5ff` | `bg-primary-fixed-dim`        | --                                     |
| `on-primary`                 | `#ffffff` | `text-on-primary`             | Text on primary surfaces               |
| `on-primary-container`       | `#98b1ff` | `text-on-primary-container`   | --                                     |
| `on-primary-fixed`           | `#00174b` | `text-on-primary-fixed`       | Text on highlighted words              |
| `on-primary-fixed-variant`   | `#033ea6` | --                            | --                                     |
| `inverse-primary`            | `#b4c5ff` | --                            | Dark mode primary                      |

### Secondary (Dutch Orange)

| Token                        | Hex       | Tailwind Class                  | Usage                                 |
| ---------------------------- | --------- | ------------------------------- | ------------------------------------- |
| `secondary`                  | `#a04100` | `text-secondary` `bg-secondary` | Success, celebration, heatmap fills   |
| `secondary-container`        | `#fe6b00` | `bg-secondary-container`        | Brighter orange accent                |
| `secondary-fixed`            | `#ffdbcc` | `bg-secondary-fixed`            | Streak icon background                |
| `secondary-fixed-dim`        | `#ffb693` | --                              | --                                    |
| `on-secondary`               | `#ffffff` | `text-on-secondary`             | --                                    |
| `on-secondary-container`     | `#572000` | --                              | --                                    |
| `on-secondary-fixed`         | `#351000` | --                              | --                                    |
| `on-secondary-fixed-variant` | `#7a3000` | --                              | --                                    |

### Tertiary (Gold / Bronze)

| Token                        | Hex       | Tailwind Class                    | Usage                               |
| ---------------------------- | --------- | --------------------------------- | ------------------------------------ |
| `tertiary`                   | `#452900` | `text-tertiary` `bg-tertiary`     | XP/achievement states               |
| `tertiary-container`         | `#643d00` | `bg-tertiary-container`           | XP ring track                       |
| `tertiary-fixed`             | `#ffddb8` | `bg-tertiary-fixed`               | Achievement badge backgrounds        |
| `tertiary-fixed-dim`         | `#ffb95f` | --                                | --                                  |
| `on-tertiary`                | `#ffffff` | --                                | --                                  |
| `on-tertiary-container`      | `#f8a110` | `text-on-tertiary-container`      | Star icons, bolt icons              |
| `on-tertiary-fixed`          | `#2a1700` | --                                | --                                  |
| `on-tertiary-fixed-variant`  | `#653e00` | --                                | --                                  |

### Error

| Token                | Hex       | Tailwind Class        | Usage                    |
| -------------------- | --------- | --------------------- | ------------------------ |
| `error`              | `#ba1a1a` | `text-error`          | Hearts, exam countdown   |
| `error-container`    | `#ffdad6` | `bg-error-container`  | Error hover states       |
| `on-error`           | `#ffffff` | --                    | --                       |
| `on-error-container` | `#93000a` | --                    | --                       |

### Surfaces & Backgrounds

| Token                      | Hex       | Tailwind Class                    | Usage                                     |
| -------------------------- | --------- | --------------------------------- | ----------------------------------------- |
| `background`               | `#f9f9f7` | `bg-background`                   | Page background (warm "Paper")            |
| `surface`                  | `#f9f9f7` | `bg-surface`                      | Level 0 — The Floor                       |
| `surface-container-lowest` | `#ffffff` | `bg-surface-container-lowest`     | Level 2 — Cards, interactive targets      |
| `surface-container-low`    | `#f4f4f2` | `bg-surface-container-low`        | Level 1 — Section backgrounds, settings   |
| `surface-container`        | `#eeeeec` | `bg-surface-container`            | --                                        |
| `surface-container-high`   | `#e8e8e6` | `bg-surface-container-high`       | Progress tracks, secondary buttons        |
| `surface-container-highest`| `#e2e3e1` | `bg-surface-container-highest`    | Locked states, nested interactive elements|
| `surface-bright`           | `#f9f9f7` | --                                | --                                        |
| `surface-dim`              | `#dadad8` | --                                | --                                        |
| `surface-variant`          | `#e2e3e1` | --                                | --                                        |
| `surface-tint`             | `#2d58bf` | --                                | --                                        |

### Text & Outlines

| Token               | Hex       | Tailwind Class              | Usage                                |
| -------------------- | --------- | --------------------------- | ------------------------------------ |
| `on-surface`         | `#1a1c1b` | `text-on-surface`           | Primary text (NEVER use pure #000)   |
| `on-surface-variant`  | `#434653` | `text-on-surface-variant`   | Secondary text, labels               |
| `on-background`      | `#1a1c1b` | --                          | Same as on-surface                   |
| `outline`            | `#747684` | `text-outline`              | Locked level text                    |
| `outline-variant`    | `#c4c6d5` | `border-outline-variant`    | Ghost borders (at /20-/30 opacity)   |

### Inverse (Dark Mode)

| Token               | Hex       | Usage               |
| -------------------- | --------- | ------------------- |
| `inverse-surface`    | `#2f3130` | Dark mode surfaces  |
| `inverse-on-surface` | `#f1f1ef` | Dark mode text      |

**Dark Mode Hardcoded Overrides:**
- Primary text: `dark:text-[#4785ff]`
- Glass nav background: `dark:bg-[#1a1c1b]/70`
- Inactive nav text: `dark:text-[#f9f9f7]/50`

---

## 3. Typography

### Font Families

| Role           | Font               | Tailwind Class  | Usage                                         |
| -------------- | ------------------ | --------------- | --------------------------------------------- |
| UI / Headings  | Plus Jakarta Sans  | `font-headline` | All headings, nav, labels, buttons             |
| Dutch Content  | Noto Serif         | `font-body`     | ALL Dutch vocabulary, sentences, translations  |
| Labels / Micro | Plus Jakarta Sans  | `font-label`    | Default body font, micro-copy                  |

### Type Scale

| Name       | Class        | Weight            | Usage                                        |
| ---------- | ------------ | ----------------- | -------------------------------------------- |
| Display    | `text-4xl`   | `font-bold`       | Flip card Dutch word (Noto Serif)            |
| Hero       | `text-3xl`   | `font-extrabold`  | Page titles, large stats, score %            |
| Heading    | `text-2xl`   | `font-extrabold`  | Greeting, question headers                   |
| Title      | `text-xl`    | `font-extrabold`  | App name, bottom sheet title                 |
| Body Large | `text-lg`    | `font-bold`       | Stat numbers, CTA title, Dutch passage text  |
| Body       | `text-sm`    | `font-bold`       | Subtitles, descriptions                      |
| Label      | `text-xs`    | `font-bold`       | XP values, chip text, sub-labels             |
| Micro      | `text-[10px]`| `font-bold uppercase` | Section headers, stat labels, categories |
| Nano       | `text-[8px]` | `font-black uppercase`| Achievement labels                       |

### Tracking

| Pattern                       | Usage                        |
| ----------------------------- | ---------------------------- |
| `tracking-tight`              | All headings                 |
| `tracking-wider`              | Uppercase micro labels       |
| `tracking-widest`             | Stat labels, categories      |
| `tracking-[0.1em]`            | Step indicators              |
| `tracking-[0.2em]`            | Week header labels           |
| `tracking-tighter`            | Stat sub-labels              |
| `tracking-[0.05em]`           | Nav labels                   |

---

## 4. Border Radius

| Token   | Value      | Tailwind         | Usage                                    |
| ------- | ---------- | ---------------- | ---------------------------------------- |
| DEFAULT | 1rem (16px)| `rounded`        | Cards, buttons, answer options           |
| Custom  | 20px       | `rounded-[20px]` | Streak/XP hero card                      |
| lg      | 2rem (32px)| `rounded-lg`     | Continue CTA, primary action cards       |
| xl      | 3rem (48px)| `rounded-xl`     | Exam banner, mastery rings               |
| 2xl     | --         | `rounded-2xl`    | Bottom sheet chips, settings cards       |
| 3xl     | --         | `rounded-t-3xl`  | Bottom sheet container                   |
| full    | 9999px     | `rounded-full`   | Pills, nav items, progress bars, avatars |

---

## 5. Shadows

All shadows are **tinted** — never pure black.

| Name           | Value                                         | Usage                          |
| -------------- | --------------------------------------------- | ------------------------------ |
| Card Ambient   | `0px 12px 32px rgba(26, 28, 27, 0.06)`       | Main cards, floating nav       |
| Card Subtle    | `0px 4px 16px rgba(26, 28, 27, 0.04)`        | Stat grid cards                |
| Card Light     | `0px 8px 24px rgba(26, 28, 27, 0.04)`        | Activity heatmap card          |
| Bottom Sheet   | `0px -8px 40px rgba(0, 0, 0, 0.1)`           | Lesson detail bottom sheet     |
| Flip Card      | `0px 12px 32px rgba(0, 41, 117, 0.15)`       | Vocab flip card (primary-tint) |
| `shadow-lg`    | Tailwind default                              | CTA buttons, active nav        |
| `shadow-sm`    | Tailwind default                              | Week pills, rating buttons     |

---

## 6. Spacing

| Scale    | Value   | Classes                          | Usage                              |
| -------- | ------- | -------------------------------- | ---------------------------------- |
| Micro    | 0.5rem  | `gap-1` `gap-1.5` `gap-0.5`     | Icon gaps, star gaps, heatmap      |
| Small    | 0.75rem | `gap-2` `gap-3` `p-3`           | Button gaps, chip padding          |
| Standard | 1rem    | `gap-4` `p-4` `p-5`             | Card padding, stat padding         |
| Section  | 1.5rem  | `p-6` `gap-6` `space-y-6`       | Main card padding, section gaps    |
| Large    | 2rem    | `space-y-8` `gap-8` `mb-8`      | Between major sections             |
| XL       | 2.5rem  | `mb-10`                          | Hero section margin                |

**Page Framework:**
- Horizontal padding: `px-6` (universal)
- Top offset: `pt-20` to `pt-24` (below fixed header)
- Bottom offset: `pb-32` (above fixed bottom nav)

---

## 7. Glassmorphism

### Glass Navigation (top + bottom)

```
bg-[#f9f9f7]/70 dark:bg-[#1a1c1b]/70 backdrop-blur-xl
```

- **Top bar:** `fixed top-0 w-full z-50 h-16`
- **Bottom nav:** `fixed bottom-0 w-full z-50` with floating pill `rounded-full mx-6 h-16`

### Background Decorations (lesson player, vocabulary)

```
fixed -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10
fixed bottom-32 -left-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl -z-10
```

---

## 8. Component Patterns

### Buttons

**Primary CTA:**
```
bg-gradient-to-b from-primary to-primary-container text-white rounded-full
font-extrabold text-lg shadow-lg active:scale-95 transition-transform
```

**Secondary / Surface:**
```
bg-surface-container-low text-on-surface-variant rounded-full
text-sm font-semibold hover:bg-surface-container-high transition-colors
```

### Navigation

**Active item:**
```
bg-[#002975] text-white rounded-full w-12 h-12
transition-all duration-300 scale-105 shadow-lg
```

**Inactive item:**
```
text-[#1a1c1b]/50 dark:text-[#f9f9f7]/50 w-12 h-12
hover:opacity-80 transition-opacity
```

**Nav label:** `text-[10px] uppercase tracking-[0.05em] font-bold` (hidden on active)

### Cards

**Stat Card:**
```
bg-surface-container-lowest p-5 rounded-lg
shadow-[0px_4px_16px_rgba(26,28,27,0.04)]
flex items-center gap-4
```

**Hero Card (Streak/XP):**
```
bg-surface-container-lowest p-6 rounded-[20px]
shadow-[0px_12px_32px_rgba(26,28,27,0.06)] space-y-6
```

### Answer Options (Lesson Player)

**Default:**
```
bg-surface-container-lowest rounded-DEFAULT
border-[1.5px] border-outline-variant/30
hover:border-primary transition-all duration-200 active:scale-[0.98]
```

**Selected:**
```
bg-primary/5 rounded-DEFAULT border-[1.5px] border-primary
```

**Radio circle (default):** `w-6 h-6 rounded-full border-2 border-outline-variant`
**Radio circle (selected):** `w-6 h-6 rounded-full bg-primary` with inner `w-2.5 h-2.5 bg-white rounded-full`

### Feedback

**Correct:**
```
bg-green-100/80 rounded-lg p-4 border border-green-200
```
Icon: `w-10 h-10 bg-green-500 rounded-full text-white`
Text: `font-bold text-green-900 font-headline`

### Dutch Text Passage

```
bg-[#FFFBF5] p-6 rounded-lg shadow-sm border-l-4 border-primary-container
```
Inner: `font-body text-lg leading-relaxed text-on-surface`
Highlighted word: `bg-primary-fixed text-on-primary-fixed px-1 rounded`

### Flip Card (Vocabulary)

**Front:**
```
bg-gradient-to-br from-primary to-primary-container
shadow-[0px_12px_32px_rgba(0,41,117,0.15)]
border-b-4 border-primary-container/50
```

**Back:**
```
bg-surface-container-lowest
shadow-[0px_12px_32px_rgba(26,28,27,0.06)]
border-2 border-[#4caf50]/20
```

**3D Flip CSS:**
```css
.perspective-1000 { perspective: 1000px; }
.preserve-3d { transform-style: preserve-3d; }
.backface-hidden { backface-visibility: hidden; }
.rotate-y-180 { transform: rotateY(180deg); }
```

### Rating Buttons (Hard / OK / Easy)

```
bg-surface-container-lowest rounded-2xl shadow-sm p-4
active:scale-95 transition-all duration-200
```
Layout: `grid grid-cols-3 gap-3`

### Progress Indicators

**Segmented Progress (Lesson Player):**
```
h-2.5 flex gap-1.5
```
- Active: `bg-secondary rounded-full`
- Partial: `bg-secondary rounded-full opacity-40`
- Empty: `bg-surface-container-highest rounded-full`

**Linear Progress Bar:**
```
h-2 w-full bg-surface-container-high rounded-full overflow-hidden
```
Fill: `bg-secondary rounded-full` (or `bg-primary`) with width %

**XP Ring (SVG):**
- Track: `text-tertiary-fixed` stroke
- Progress: `text-tertiary` stroke with `stroke-dasharray` / `stroke-dashoffset`
- Size: `w-16 h-16`, radius `28`, stroke-width `6`
- Container: `relative`, rotated `-rotate-90`

### Activity Heatmap

```
grid grid-flow-col grid-rows-7 gap-1.5
```
Cell: `w-3.5 h-3.5 rounded-sm`
Tiers: `bg-surface-container-high` (empty) | `bg-secondary/10` | `/20` | `/40` | `/60` | `/80` | `bg-secondary` (full)

### Bottom Sheet

```
rounded-t-3xl shadow-[0px_-8px_40px_rgba(0,0,0,0.1)] p-6
```
Drag handle: `w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-6`

### Lesson Map Nodes

**Completed:** `w-14 h-14 rounded-full bg-primary text-white shadow-md` with check icon
**Current (pulsing):** `w-14 h-14 rounded-full bg-surface-container-lowest border-4 border-primary` with `pulse-ring` animation
**Locked:** `w-14 h-14 rounded-full bg-surface-container-highest text-on-surface-variant opacity-40` with lock icon

### Badges & Chips

**Type badge:** `px-2 py-0.5 rounded-full bg-{color}/10 text-{color} text-[10px] font-bold`
**XP badge:** `bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold`
**Level badge:** `px-3 py-1 rounded-full bg-primary-container text-white text-xs font-bold uppercase tracking-wider`

### Achievements

**Unlocked:** `aspect-square bg-secondary-fixed rounded-xl shadow-sm` (or `bg-tertiary-fixed`, `bg-primary-fixed`)
**Locked:** `aspect-square bg-surface-container-highest rounded-xl opacity-30 grayscale`
**Label:** `text-[8px] font-black uppercase text-center`

---

## 9. Animations

| Name             | Definition                                                                                   | Usage                |
| ---------------- | -------------------------------------------------------------------------------------------- | -------------------- |
| `pulse-ring`     | `0%: scale(0.95) shadow(0 0 0 0 rgba(0,41,117,0.7))` to `70%: scale(1) shadow(12px)` to `100%` | Current lesson node  |
| `active:scale-95`| Tailwind utility                                                                             | All tappable buttons |
| `active:scale-[0.98]` | Tailwind utility                                                                        | Cards, answer options|
| `duration-200`   | Tailwind                                                                                     | Hover transitions    |
| `duration-300`   | Tailwind                                                                                     | Active nav item      |
| `duration-500`   | Tailwind                                                                                     | Bottom sheet slide   |
| `duration-700`   | Tailwind                                                                                     | Flip card rotation   |

---

## 10. Icon System

**Library:** [Material Symbols Outlined](https://fonts.google.com/icons) (Google Fonts)

**Base settings:**
```css
font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```

**Filled variant** (for active/important icons):
```css
font-variation-settings: 'FILL' 1;
```
Used on: hearts, stars, streak fire, active nav, bookmarks, bolt, verified badge

**Key icons:**
`home` `menu_book` `format_list_bulleted` `person` `local_fire_department` `bolt` `check` `lock` `star` `favorite` `arrow_back` `close` `chevron_right` `auto_stories` `description` `calendar_today` `menu` `notifications` `bookmark` `check_circle` `dark_mode` `settings` `emoji_events` `trending_up` `arrow_forward` `more_vert` `bakery_dining` `verified` `rewarded_ads` `group` `event` `stars` `style`

---

## 11. Layout Rules

| Context       | Max Width        | Notes                              |
| ------------- | ---------------- | ---------------------------------- |
| Dashboard     | `max-w-[390px]`  | Mobile-first single column         |
| Profile       | `max-w-md`       | Slightly wider for stats grid      |
| Vocabulary    | `max-w-md`       | Flip card needs breathing room     |
| Lesson Player | `max-w-2xl`      | Reading passages need width        |
| Lesson Nodes  | `max-w-xs`       | Centered narrow path               |

**Fixed elements:**
- Top header: `fixed top-0 z-50 h-16`
- Bottom nav: `fixed bottom-0 z-50` (hidden in lesson player focus mode)
- Bottom action bar (lesson player): `fixed bottom-0 z-50` with blur background
- Bottom sheet: `fixed bottom-0 z-[60]` (above nav)

---

## 12. Do's and Don'ts

### Do

- Use tonal background shifts (`surface` → `surface-container-low` → `surface-container-lowest`) instead of borders
- Use `font-body` (Noto Serif) for **every** instance of Dutch language text
- Embrace generous whitespace ("The Dutch Gap")
- Use `on-surface` (`#1a1c1b`) — never pure black `#000000`
- Use tinted shadows (`rgba(26, 28, 27, ...)` or `rgba(0, 41, 117, ...)`)
- Use gradient CTAs (`from-primary to-primary-container`)
- Use intentional asymmetric padding (more on bottom than top)

### Don't

- Use 1px borders to separate sections or list items
- Use pure black `#000000` anywhere
- Use standard Material shadows — keep them diffused, light, and tinted
- Use divider lines on cards
- Use heavy visual weight for shadows — they should be barely perceptible

---

## Tailwind Config (for reference)

```js
// tailwind.config.ts extend block
{
  colors: {
    "primary": "#002975",
    "primary-container": "#003da5",
    "primary-fixed": "#dbe1ff",
    "primary-fixed-dim": "#b4c5ff",
    "on-primary": "#ffffff",
    "on-primary-container": "#98b1ff",
    "on-primary-fixed": "#00174b",
    "on-primary-fixed-variant": "#033ea6",
    "inverse-primary": "#b4c5ff",
    "secondary": "#a04100",
    "secondary-container": "#fe6b00",
    "secondary-fixed": "#ffdbcc",
    "secondary-fixed-dim": "#ffb693",
    "on-secondary": "#ffffff",
    "on-secondary-container": "#572000",
    "on-secondary-fixed": "#351000",
    "on-secondary-fixed-variant": "#7a3000",
    "tertiary": "#452900",
    "tertiary-container": "#643d00",
    "tertiary-fixed": "#ffddb8",
    "tertiary-fixed-dim": "#ffb95f",
    "on-tertiary": "#ffffff",
    "on-tertiary-container": "#f8a110",
    "on-tertiary-fixed": "#2a1700",
    "on-tertiary-fixed-variant": "#653e00",
    "error": "#ba1a1a",
    "error-container": "#ffdad6",
    "on-error": "#ffffff",
    "on-error-container": "#93000a",
    "background": "#f9f9f7",
    "surface": "#f9f9f7",
    "surface-bright": "#f9f9f7",
    "surface-dim": "#dadad8",
    "surface-variant": "#e2e3e1",
    "surface-tint": "#2d58bf",
    "surface-container-lowest": "#ffffff",
    "surface-container-low": "#f4f4f2",
    "surface-container": "#eeeeec",
    "surface-container-high": "#e8e8e6",
    "surface-container-highest": "#e2e3e1",
    "on-surface": "#1a1c1b",
    "on-surface-variant": "#434653",
    "on-background": "#1a1c1b",
    "outline": "#747684",
    "outline-variant": "#c4c6d5",
    "inverse-surface": "#2f3130",
    "inverse-on-surface": "#f1f1ef",
  },
  fontFamily: {
    "headline": ["Plus Jakarta Sans"],
    "body": ["Noto Serif"],
    "label": ["Plus Jakarta Sans"],
  },
  borderRadius: {
    DEFAULT: "1rem",
    lg: "2rem",
    xl: "3rem",
    full: "9999px",
  },
}
```
