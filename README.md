# logic trainer

A local-first symbolic logic practice application for PHIL-P 250. It is a static React application: exercises, grading, progress, and review data all run in the browser with no API, account, or remote database.

**Live app:** [taherezm.github.io/phil250-logic-trainer](https://taherezm.github.io/phil250-logic-trainer/)

## Architecture

```text
topic selection → set builder → exercise renderer → deterministic grader → localStorage
```

- **UI:** React 19 and TypeScript, bundled by Vite 8 as a single-page application.
- **Content:** `src/content/topics.ts` maps subskills to an engine; `src/content/exercises.ts` defines exercises as a discriminated union (`choice`, `formula`, `truth-table`, `proof`, or `model`).
- **TFL/FOL parsing:** Recursive-descent parsers normalize keyboard input, tokenize formulas, build typed abstract syntax trees, and render canonical notation.
- **Truth tables:** The TFL evaluator enumerates valuations from each formula's atoms and derives rows, classifications, equivalence, consistency, and validity.
- **Proof checking:** The Fitch checker parses every line, tracks nested subproof paths, validates citations and accessible scope, and applies configurable TFL/FOL rule constraints.
- **Finite models:** The FOL evaluator recursively interprets predicates, identity, connectives, and quantifiers over an explicit finite domain, returning witnesses or counterexamples.
- **Practice generation:** Curated exercises and seeded truth-table problems are selected deterministically across chosen subskills and difficulty levels.
- **Persistence:** Attempts, review flags, and unfinished sessions are stored under versioned `localStorage` keys. At most 500 attempt records are retained.

The application does not use an AI or machine-learning model. All grading is reproducible TypeScript logic executed locally.

## Project layout

```text
src/
├── components/     Practice setup, sessions, formula and truth-table inputs
├── content/        Topic catalog, exercises, and proof-rule configuration
├── logic/          TFL/FOL parsers, evaluators, proof checker, and model engine
├── pages/          Practice, proof, model, review, and source workspaces
├── storage/        Versioned browser persistence
└── tests/          Vitest unit and component coverage
e2e/                Playwright critical-path tests
```

## Local development

Requires Node.js 20.19+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Vitest covers parsers, evaluators, proof rules, and React behavior. Playwright covers the main desktop and mobile workflows.

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`. The workflow installs locked dependencies, runs the production build, uploads `dist/`, and deploys it to GitHub Pages. Vite's base path is `/phil250-logic-trainer/` so generated assets resolve under the project URL.

## Academic conventions

*forall x: Calgary* is the primary source for notation, truth tables, Fitch rules, quantifier restrictions, and finite-model semantics. Adapted exercises are marked in the content data and credited on the in-app Sources page; no source is scraped at runtime.
