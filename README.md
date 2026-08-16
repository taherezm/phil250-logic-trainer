# Logic Trainer

A local-first symbolic logic practice application for PHIL-P 250. The interface is organized by topic rather than course week, and every topic is available immediately.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

## Verification

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

## Academic conventions

The current *forall x: Calgary* revision is the primary source for notation, truth tables, Fitch rules, quantifier restrictions, and finite-model semantics. Because no course syllabus or rule sheet was present when the app was built, optional derived rules follow the book’s current organization. Rule availability is defined in `src/content/proofRules.ts` and can be adjusted without changing the editor.

Adapted content is credited on the in-app Sources page. No source is scraped at runtime, and all grading is deterministic.
