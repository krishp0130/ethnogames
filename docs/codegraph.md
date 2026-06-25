# CodeGraph in this repo

## What was done

The repo includes `.codegraph/.gitignore`:

```gitignore
*
!.gitignore
```

This keeps **all** CodeGraph-generated local files out of git (graph database, `daemon.pid`, sockets, logs) while allowing the ignore rule itself to be committed.

## What CodeGraph is for

[CodeGraph](https://github.com/codegraph-io/codegraph) (Cursor MCP: `user-codegraph`) indexes the codebase for structural queries — call graphs, dependencies, symbol search — to help agents navigate large repos without reading every file.

## Current status

- **No graph data is committed** to this repository.
- The CodeGraph MCP server may need to be enabled in Cursor Settings; if it errors, agents should use `docs/AGENTS.md` and ripgrep/semantic search instead.
- Regenerating the index is a **local** action; it does not change application behavior.

## For agents

1. Prefer `docs/AGENTS.md` and module READMEs for intentional architecture.
2. Use CodeGraph MCP when available for "who calls X" or impact analysis.
3. Do not commit contents of `.codegraph/` except `.gitignore`.
4. After large refactors (e.g. `server/index.ts` → `gameSocket.ts`), re-index locally if using CodeGraph.

## Relationship to human docs

| Source | Audience |
| ------ | -------- |
| `README.md` | Players, contributors, deployers |
| `docs/**` | Agents and maintainers |
| CodeGraph index | Machine navigation (local only) |
