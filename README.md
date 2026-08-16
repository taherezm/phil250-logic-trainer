# Logic Trainer

Logic Trainer is a local-first PHIL-P 250 practice application for truth-functional logic (TFL), first-order logic (FOL), truth tables, Fitch proofs, and finite models. It is a static React application: the browser loads a compiled JavaScript bundle and performs every parse, evaluation, grade, and persistence operation locally.

**Live application:** [taherezm.github.io/phil250-logic-trainer](https://taherezm.github.io/phil250-logic-trainer/)

## Runtime architecture

```text
Topic catalog
    ↓ selected subskill IDs
Deterministic set builder
    ↓ Exercise[]
Exercise-specific React renderer
    ↓ submitted answer
Parser / evaluator / proof checker
    ↓ typed grading result
Feedback UI + versioned localStorage
```

[`src/App.tsx`](src/App.tsx) is the application controller. It owns the active workspace, selected subskills, resume state, and proof/model handoff state. The application does not use a client-side router; navigation switches typed React views in memory, so GitHub Pages does not require an SPA fallback route.

The main implementation layers are:

| Layer | Implementation |
| --- | --- |
| Interface | React 19 function components and hooks |
| Type system | TypeScript 6 with discriminated unions for formulas and exercises |
| Build | Vite 8; `tsc -b` runs before the production bundle |
| Logic engines | Pure TypeScript parsers, evaluators, and proof validators |
| Persistence | Browser `localStorage`; no server, database, authentication, or telemetry |
| Tests | Vitest + Testing Library for logic/UI; Playwright for critical browser flows |

## Content and practice-set construction

[`src/content/topics.ts`](src/content/topics.ts) defines the course taxonomy. Each subskill is assigned to one of four engines: `curated`, `truth-table`, `proof`, or `model`. [`src/content/exercises.ts`](src/content/exercises.ts) stores exercises as a discriminated union:

```ts
type Exercise =
  | ChoiceExercise
  | FormulaExercise
  | TruthTableExercise
  | ProofExercise
  | ModelExercise
```

Every exercise carries a stable ID, topic, subskill, difficulty, prompt, explanation, three hints, source chapter, and attribution status. Kind-specific fields contain accepted formulas, answer indices, premises/conclusions, or finite-model data. Adding content therefore does not require changing the session renderer or grading engine.

[`buildSet`](src/components/PracticeSession.tsx) constructs a session in four steps:

1. Filter exercises by selected subskill and difficulty.
2. Add reproducible, seed-based truth-table exercises when a semantic subskill is selected.
3. Partition candidates by subskill.
4. Fill the requested 5-, 10-, or 20-question set by cycling through those partitions and then through each partition's exercises.

This is intentionally deterministic: the same configuration produces the same ordering, which makes grading and tests reproducible.

## Formula representation and parsing

TFL and FOL use typed abstract syntax trees rather than grading raw strings. TFL nodes are atoms, falsum, negations, or binary formulas. FOL adds predicates, terms, identity, and quantified formulas. The FOL shape is defined in [`src/logic/fol/types.ts`](src/logic/fol/types.ts):

```ts
type FOLFormula =
  | { type: 'predicate'; name: string; terms: Term[] }
  | { type: 'identity'; left: Term; right: Term }
  | { type: 'bottom' }
  | { type: 'not'; operand: FOLFormula }
  | { type: 'binary'; operator: BinaryOperator; left: FOLFormula; right: FOLFormula }
  | { type: 'quantifier'; quantifier: 'forall' | 'exists'; variable: string; body: FOLFormula }
```

The parsers in [`src/logic/tfl/parser.ts`](src/logic/tfl/parser.ts) and [`src/logic/fol/parser.ts`](src/logic/fol/parser.ts) use the same pipeline:

1. Normalize keyboard aliases such as `->`, `&`, `forall`, `exists`, and `~` into canonical symbols.
2. Tokenize while retaining character offsets for syntax errors.
3. Parse with recursive-descent precedence levels: `iff → implication → disjunction → conjunction → primary`.
4. Build a typed AST and reject trailing or malformed input.
5. Render the AST back to a canonical string with only the parentheses required by precedence.

Implication is parsed right-associatively; conjunction, disjunction, and biconditional are parsed as chains. Formula answers are compared structurally after parsing. TFL exercises may additionally permit truth-functional equivalence; FOL exercises compare canonical AST renderings.

The FOL parser also exposes free-variable discovery, name collection, and capture-aware substitution. Those operations are reused by quantifier and identity proof rules.

## Deterministic grading engines

### Truth-functional evaluation

[`src/logic/tfl/evaluator.ts`](src/logic/tfl/evaluator.ts) recursively evaluates an AST under a `Record<string, boolean>` valuation. For `n` atoms, it generates all `2^n` valuations, evaluates every unique subformula, and builds dependency-ordered truth-table columns.

The same evaluator implements:

- tautology, contradiction, and contingency classification;
- truth-functional equivalence across the union of two formulas' atoms;
- counterexample search by filtering rows where all premises are true and the conclusion is false;
- cell grading that reports the first incorrect dependency by row and column.

### Fitch proof checking

[`src/logic/proofs/checker.ts`](src/logic/proofs/checker.ts) validates a proof in two passes.

The structural pass converts indentation into a `path: number[]` for each line. A path records the assumptions whose subproofs contain that line. Citation access is a prefix test: a cited line is accessible only when its path is a prefix of the current line's path. Range citations must begin with an assumption, end inside the same subproof, occur earlier, and be discharged from the current parent scope.

The semantic pass parses each formula and dispatches on the selected rule. Every rule checks its required count of line/range citations and then validates an AST relationship. Examples include matching both conjuncts for `∧I`, matching a subproof's endpoints for `→I`, and requiring two case subproofs with the same conclusion for `∨E`.

FOL rules add side-condition checks:

- `∀I` rejects a name occurring in an undischarged assumption;
- `∃E` requires a fresh witness that does not escape into the premise, conclusion, or surrounding assumptions;
- `=E` verifies that at least one occurrence of an identical name was consistently substituted;
- substitution and quantifier-conversion checks operate on ASTs rather than text replacement.

A proof is complete only when every line is valid and the last line is the target conclusion at depth zero.

### Finite-model evaluation

[`src/logic/models/evaluator.ts`](src/logic/models/evaluator.ts) represents an interpretation as:

```ts
interface FiniteModel {
  domain: string[]
  names: Record<string, string>
  predicates: Record<string, string[][]>
}
```

Names map to domain elements; predicate extensions are arrays of tuples, so the same structure supports unary predicates and n-place relations. Evaluation recursively walks the FOL AST with a variable assignment. Existential quantifiers stop at the first satisfying object and return it as a witness; universal quantifiers stop at the first failure and return it as a counterexample.

## Session state and local persistence

[`src/components/PracticeSession.tsx`](src/components/PracticeSession.tsx) selects the renderer and grader from `exercise.kind`. Guided mode exposes hints, practice mode returns immediate feedback, and test mode defers results until the set ends.

[`src/storage/progress.ts`](src/storage/progress.ts) stores two versioned records:

- `logic-trainer:attempts:v1`: up to 500 newest attempts, including answer, expected answer, attempts, hints, correctness, and review status;
- `logic-trainer:session:v1`: exercise IDs, selected subskills, configuration, current index, and save timestamp.

Parsing is guarded with fallbacks so corrupt or absent browser data cannot prevent startup. No state leaves the device.

## Source layout

```text
src/
├── components/   Practice setup/session and formula/truth-table controls
├── content/      Topics, exercises, and configurable proof-rule catalog
├── logic/
│   ├── tfl/      TFL AST, parser, evaluator, and truth-table algorithms
│   ├── fol/      FOL AST, parser, substitution utilities, and renderer
│   ├── proofs/   Fitch structure, citation, scope, and rule validation
│   └── models/   Recursive finite-interpretation evaluator
├── pages/        Practice, proof, model, review, and source workspaces
├── storage/      Versioned local persistence
└── tests/        Unit and component tests
e2e/              Playwright critical-flow tests
```

## Development and verification

Requires Node.js 20.19+ and pnpm 10.

```sh
pnpm install
pnpm dev
```

Run the full local verification suite with:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

## Build and deployment

[`vite.config.ts`](vite.config.ts) sets `base: '/phil250-logic-trainer/'`, so Vite rewrites generated asset URLs for the GitHub project path. `pnpm build` runs TypeScript project compilation and then emits the static application to `dist/`.

Pushes to `main` trigger [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). GitHub Actions installs pnpm and Node, restores the pnpm cache, performs a frozen-lockfile install, builds `dist/`, uploads it as a Pages artifact, and deploys it with GitHub's OIDC-based Pages action.

## Academic and security boundaries

*forall x: Calgary* is the primary source for notation, truth tables, Fitch rules, quantifier restrictions, and finite-model semantics. Adapted exercises are marked in the data and credited on the in-app Sources page.

This project does not contain an AI/ML model, call an external inference API, scrape source material at runtime, or execute submitted formulas. User input is tokenized into constrained AST nodes and evaluated by deterministic TypeScript functions.
