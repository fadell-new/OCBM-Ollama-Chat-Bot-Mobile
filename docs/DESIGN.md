# Design

## Principles

- **Serif headings + clean sans body** — Inknut Antiqua for titles and button labels, Inter for body text.
- **Pill controls** — buttons and badges use fully rounded corners (`radii.pill`).
- **Soft surfaces** — cards use `theme.surface` / `theme.surfaceAlt` with hairline borders.
- **Calm spacing** — a 4px-based scale (`spacing.xs` … `spacing.xxxl`).
- **Light + Dark** — every screen supports both via `useAppTheme`.

## Tokens

### Colors

Defined in `src/theme/colors.ts` and consumed through `useAppTheme()`. Key semantic tokens:

| Token | Usage |
| --- | --- |
| `bg` | Screen background |
| `surface` / `surfaceAlt` | Cards, inputs, chips |
| `text` / `textMuted` | Primary / secondary text |
| `accent` / `onAccent` | Primary button fill + label |
| `accentStrong` | Focus rings, selected radios |
| `control` | Secondary button fill |
| `border` | Hairline borders |
| `success` / `danger` / `overlay` | Status, destructive, modal backdrop |

### Typography

| Token | Font | Size |
| --- | --- | --- |
| `fonts.heading` | Inknut Antiqua 600 | 24–48 |
| `fonts.medium` | Inter 500 | 12–20 |
| `fonts.body` | Inter 400 | 14–16 |
| `fonts.semibold` | Inter 600 | 14 |

### Spacing & radius

- Spacing: `xs 4, sm 8, md 12, lg 16, xl 20, xxl 24, xxxl 32`.
- Radii: `pill 999, bubble 20, card 20, sheet 28`.

## Component inventory

| Component | Purpose |
| --- | --- |
| `Screen` | Safe-area wrapper with optional padding |
| `SettingsPage` | Header + keyboard-aware ScrollView + optional footer |
| `AppButton` | Pill button (primary/secondary/ghost/danger, md/lg) |
| `AppInput` | Labeled input with error/hint |
| `AppCard` | Surface card container |
| `SettingsRow` | Settings list row with value + chevron |
| `ConnectionBadge` | Status dot + label |
| `ModelRow` | Model radio row / downloaded model row with delete |
| `AttachmentChip` | Attachment thumbnail + name + size + remove |
| `Composer` | Multiline input + attach + send/stop |
| `ChatBubble` | Message bubble with markdown-ish rendering |
| `EmptyState` | Centered empty placeholder |
| `ConfirmDialog` | Modal confirmation |
| `Toast` | Transient bottom toast |

## Figma mapping

The Figma file `UlqICuEsPGwxmcNTVuLngR` (8 screens) maps to routes:

| Figma screen | Route |
| --- | --- |
| Splash / Welcome | `/onboarding` (step 0) |
| Connection | `/onboarding` (step 1) + `/settings/connection` |
| Model picker | `/onboarding` (step 2) + `/settings/models` |
| Chat (empty) | `/(drawer)` |
| Drawer | `/(drawer)` (drawer content) |
| Settings | `/settings` |
| Customize AI | `/settings/customize` |
| Personal Intelligence | `/settings/personal-intelligence` |
| Chat history / search | `/search` |

Missing screens (email, phone, theme, history, about, connection, models) were extended in the same visual language.
