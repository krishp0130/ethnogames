# Frontend design & composition review

Skills used: **web-design-guidelines**, **vercel-composition-patterns** (`building-components` is not in vercel-labs/agent-skills; composition patterns is the equivalent).

## Fixes applied

| Guideline | Change |
| --------- | ------ |
| Skip link | `layout.tsx` — skip to `#main-content` |
| `main` landmark | Home, Mendicot rules, play page |
| Form labels | Lobby name + room code (`sr-only` + `htmlFor`, `name`) |
| `aria-live` | Connection status, lobby errors |
| Focus visible | `.interactive-focus`, nav links, inputs, cards |
| `aria-current` | Active nav links |
| Nav composition | Split `NavTextLink` / `NavCtaLink` (no `highlight` boolean) |
| GameCard composition | Link only when `available`; else non-interactive `div` |
| Dialog a11y | Hand/game overlays: `role="dialog"`, `aria-modal`, labelled heading |
| Typography | `Connecting…`, placeholders with `…`, `tabular-nums` on scores |
| Dark mode | `color-scheme: dark` on `html` |
| Motion | `prefers-reduced-motion: reduce` global respect |
| Decorative SVG | `aria-hidden` on icon-only graphics |

## Remaining (low priority)

- URL sync for lobby browse tab (nuqs) — optional
- `transition-all` on some marketing buttons — cosmetic
- Framer `whileHover` on decorative cards — disabled by reduced-motion CSS

Re-run: `/web-design-guidelines` on `src/` after major UI changes.
