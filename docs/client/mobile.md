# Mobile browser support

Ethnogames is designed to work in mobile browsers (iOS Safari, Chrome Android, etc.) without a native app.

## Viewport and safe areas

- `layout.tsx` sets `viewportFit: cover`, `width: device-width`, and `themeColor`
- `body` uses `env(safe-area-inset-*)` for notched phones
- Play route uses `h-dvh` during a game to avoid address-bar `100vh` bugs

## Touch and input

- Global `touch-action: manipulation` on buttons/links (no 300ms tap delay)
- Inputs use `font-size: max(16px, 1em)` to prevent iOS zoom-on-focus
- Lobby inputs: `text-base`, `enterKeyHint`, room code `autoCapitalize="characters"`
- Minimum ~44–48px touch targets on primary controls (nav, lobby, overlays)
- Playable cards: amber highlight + `:active` lift via `.card-touch-lift` (`hover: none` media)

## Game table (hardest surface)

| Concern | Approach |
| ------- | -------- |
| Small width | `useViewportWidth` sizes card fan; `<380px` uses smaller cards |
| 13-card hand | Horizontal `hand-scroll` with swipe (`overflow-x-auto`, `touch-action: pan-x`) |
| Table height | `max-h: min(90vw, calc(100dvh - 13.5rem))` fits under nav + score strip |
| Trick layout | `sm` / `md` / `lg` card sizes by breakpoint (`TrickArea`) |
| Layout flash | `useMediaQuery` via `useSyncExternalStore` for correct first paint |

## Play page behavior

- **In lobby:** normal page scroll
- **In game:** `overflow-hidden` on root; inner `play-surface` scrolls if needed; `overscroll-behavior-y: contain` reduces pull-to-refresh accidents

## Testing checklist (manual)

1. iPhone / Android: create room, join, play full hand
2. Swipe bottom hand when holding 10+ cards
3. Tap highlighted card — server accepts play
4. Rotate portrait ↔ landscape during game
5. Refresh mid-game — rejoin to waiting or active table
6. Focus name input — no page zoom (iOS)

## Known limits

- No offline mode
- Multi-tab same player still unsupported
- Landscape on very short phones may need minor scroll (acceptable)
