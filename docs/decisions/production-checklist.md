# Production checklist

Use when preparing deploy or reviewing ops readiness.

## Pre-deploy verification

```bash
npm ci
npm run lint
npm run test
npm run build
NODE_ENV=production npm run start
```

- [ ] Site loads at `/`
- [ ] `/mendicot/play` connects (green indicator)
- [ ] Create room, add bots, complete a hand
- [ ] `GET /health` returns `{"ok":true,"service":"ethnogames"}`

## Required infrastructure

| Item | Recommendation |
| ---- | -------------- |
| Process | Single Node running `tsx server.ts` after `next build` |
| Redis | **Strongly recommended** — room state, TTL cleanup |
| TLS | Terminate at load balancer or platform |
| `CLIENT_ORIGINS` | Set to production URL(s), e.g. `https://ethnogames.com,https://www.ethnogames.com` |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` in containers |

## Optional env

| Variable | When |
| -------- | ---- |
| `REDIS_URL` | Managed Redis (Railway, Upstash, etc.) |
| `NEXT_PUBLIC_SERVER_URL` | Only if sockets on different origin than pages (unusual with unified server) |
| `PORT` | Platform-assigned port |

## Not production-ready yet (acceptable for MVP)

- No rate limiting
- No auth
- No structured logging / APM hooks
- No graceful shutdown (in-flight games on deploy)
- No Socket.IO Redis adapter (single instance only)
- No database for analytics or replays

## Deploy shape

```
                    ┌─────────────────┐
   Users ─────────► │ LB / CDN        │
                    │ (TLS, /health)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Node (server.ts)│
                    │ Next + Socket.IO│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Redis           │
                    └─────────────────┘
```

One service, one port. Do not split Next and game server unless you reintroduce cross-origin socket config.

## Post-MVP hardening (ordered)

1. Redis adapter + sticky sessions OR single replica
2. Rate limit `create_room` / joins per IP
3. Graceful shutdown: stop accepts, drain sockets, TTL handles orphans
4. Structured logs (roomId, event type, latency)
5. Postgres for accounts + match history (keep Redis for live state)
6. Error monitoring (Sentry, etc.)

## CI

`.github/workflows/ci.yml` — Node 22, `npm ci`, lint, test, build on `main` PRs. Extend with deploy workflow when platform is chosen.
