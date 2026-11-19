# Contributing

Please open an issue before expanding the semantic model or changing public join rules. Changes to canonical identity, versioning, concordance approval semantics or source provenance require explicit regression tests and a migration note.

## Development

Node.js 22+ is required.

```sh
npm install
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:package
npm run example
```

For routine changes, run `npm run check`. If GitHub CI is unavailable, attach the actual local command output and environment details to the PR; lack of CI is never a passing check. Do not run `npm publish` from an unreviewed branch.

Tests should use small, committed datasets and deterministic mappings. Do not include private VizHub project fixtures, access tokens, customer content or sensitive samples.
