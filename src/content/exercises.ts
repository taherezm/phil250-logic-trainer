import type { FiniteModel } from '../logic/models/evaluator'

export type Difficulty = 'introductory' | 'intermediate' | 'advanced'

interface ExerciseBase {
  id: string
  topic: string
  subskill: string
  difficulty: Difficulty
  prompt: string
  explanation: string
  hints: [string, string, string]
  sourceChapter: string
  attributionStatus: 'adapted' | 'original'
}

export interface ChoiceExercise extends ExerciseBase {
  kind: 'choice'
  options: string[]
  answer: number
}

export interface FormulaExercise extends ExerciseBase {
  kind: 'formula'
  language: 'tfl' | 'fol'
  accepted: string[]
  allowTflEquivalence?: boolean
  symbolizationKey?: string[]
}

export interface TruthTableExercise extends ExerciseBase {
  kind: 'truth-table'
  formula: string
}

export interface ProofExercise extends ExerciseBase {
  kind: 'proof'
  premises: string[]
  conclusion: string
}

export interface ModelExercise extends ExerciseBase {
  kind: 'model'
  formula: string
  model: FiniteModel
  expected: boolean
}

export type Exercise = ChoiceExercise | FormulaExercise | TruthTableExercise | ProofExercise | ModelExercise

export const exercises: Exercise[] = [
  {
    id: 'arg-parts-01', topic: 'arguments', subskill: 'argument-parts', difficulty: 'introductory', kind: 'choice',
    prompt: '“The library is open, because the lights are on and people are entering.” Which statement is the conclusion?',
    options: ['The lights are on.', 'People are entering.', 'The library is open.', 'There is no conclusion.'], answer: 2,
    explanation: '“Because” introduces the supporting reasons. The claim those reasons support—the library is open—is the conclusion.',
    hints: ['Look for the claim supported by the others.', 'The word “because” commonly introduces premises.', 'Ask what the speaker wants you to accept on the basis of the lights and the people.'], sourceChapter: 'Ch. 1–2', attributionStatus: 'original',
  },
  {
    id: 'arg-parts-02', topic: 'arguments', subskill: 'argument-parts', difficulty: 'intermediate', kind: 'choice',
    prompt: 'In “No reptiles have fur. Otis has fur. Therefore, Otis is not a reptile,” how many premises are there?',
    options: ['One', 'Two', 'Three', 'None'], answer: 1,
    explanation: 'The first two sentences provide support. The sentence after “therefore” is the conclusion.',
    hints: ['Separate supporting claims from the claim supported.', '“Therefore” marks the conclusion.', 'Count the sentences before “therefore.”'], sourceChapter: 'Ch. 1–2', attributionStatus: 'original',
  },
  {
    id: 'validity-01', topic: 'arguments', subskill: 'validity-concepts', difficulty: 'introductory', kind: 'choice',
    prompt: 'Which description correctly defines a valid argument?',
    options: ['Every premise and the conclusion are actually true.', 'It is impossible for all premises to be true while the conclusion is false.', 'The conclusion is probably true.', 'At least one premise is true.'], answer: 1,
    explanation: 'Validity concerns the absence of a counterexample case: no case has all true premises and a false conclusion.',
    hints: ['Validity is a relation between premises and conclusion.', 'Think about what a counterexample to validity would require.', 'Rule out every case with true premises and a false conclusion.'], sourceChapter: 'Ch. 3', attributionStatus: 'adapted',
  },
  {
    id: 'validity-02', topic: 'arguments', subskill: 'validity-concepts', difficulty: 'intermediate', kind: 'choice',
    prompt: 'A sound argument is:',
    options: ['Valid with all true premises.', 'Valid with a true conclusion, regardless of its premises.', 'Any argument with all true sentences.', 'An invalid argument with a true conclusion.'], answer: 0,
    explanation: 'Soundness requires both validity and true premises. A sound argument consequently has a true conclusion.',
    hints: ['Soundness combines two properties.', 'One property is validity.', 'Add truth of every premise to validity.'], sourceChapter: 'Ch. 3', attributionStatus: 'adapted',
  },
  {
    id: 'counterexample-01', topic: 'arguments', subskill: 'counterexamples', difficulty: 'intermediate', kind: 'choice',
    prompt: 'For the form “A → B; B; therefore A,” which valuation is a counterexample?',
    options: ['A: T, B: T', 'A: T, B: F', 'A: F, B: T', 'A: F, B: F'], answer: 2,
    explanation: 'When A is false and B is true, both premises A → B and B are true while conclusion A is false.',
    hints: ['A counterexample makes every premise true and the conclusion false.', 'Make the conclusion A false first.', 'With A false, choose B so that the second premise remains true.'], sourceChapter: 'Ch. 12', attributionStatus: 'original',
  },
  {
    id: 'counterexample-02', topic: 'arguments', subskill: 'counterexamples', difficulty: 'advanced', kind: 'choice',
    prompt: 'Why does A: F, B: F fail as a counterexample to “A ∨ B; therefore B”?',
    options: ['The conclusion is true.', 'The premise is false.', 'A counterexample must assign A true.', 'The argument is valid.'], answer: 1,
    explanation: 'Although conclusion B is false, premise A ∨ B is also false. A counterexample must make every premise true.',
    hints: ['Check both the premise and conclusion.', 'A false conclusion is necessary but not sufficient.', 'Evaluate A ∨ B when both atoms are false.'], sourceChapter: 'Ch. 12', attributionStatus: 'original',
  },
  {
    id: 'tfl-translation-01', topic: 'tfl-formalization', subskill: 'tfl-translation', difficulty: 'introductory', kind: 'formula',
    prompt: 'Translate: “Ada reads and Bo studies.”', language: 'tfl', symbolizationKey: ['A: Ada reads.', 'B: Bo studies.'], accepted: ['A ∧ B'],
    explanation: '“And” is symbolized by conjunction, with the two atomic sentences as conjuncts.',
    hints: ['Identify the two complete sentences.', 'The relevant connective is conjunction.', 'Join A and B with ∧.'], sourceChapter: 'Ch. 5–6', attributionStatus: 'original',
  },
  {
    id: 'tfl-translation-02', topic: 'tfl-formalization', subskill: 'tfl-translation', difficulty: 'intermediate', kind: 'formula',
    prompt: 'Translate: “Mara attends only if Noor attends.”', language: 'tfl', symbolizationKey: ['M: Mara attends.', 'N: Noor attends.'], accepted: ['M → N'],
    explanation: '“P only if Q” says that Q is necessary for P, so P → Q.',
    hints: ['“Only if” introduces a necessary condition.', 'Ask what must be true if Mara attends.', 'Use M as the antecedent and N as the consequent.'], sourceChapter: 'Ch. 7', attributionStatus: 'adapted',
  },
  {
    id: 'tfl-translation-03', topic: 'tfl-formalization', subskill: 'tfl-translation', difficulty: 'advanced', kind: 'formula',
    prompt: 'Translate: “Neither Ada nor Bo attends.”', language: 'tfl', symbolizationKey: ['A: Ada attends.', 'B: Bo attends.'], accepted: ['¬(A ∨ B)', '¬A ∧ ¬B'], allowTflEquivalence: true,
    explanation: 'Neither sentence is true. This can be represented as ¬(A ∨ B), equivalently ¬A ∧ ¬B.',
    hints: ['The sentence denies both alternatives.', 'Start with the disjunction A ∨ B and negate it.', '¬(A ∨ B) is a direct symbolization.'], sourceChapter: 'Appendix C.2', attributionStatus: 'adapted',
  },
  {
    id: 'main-connective-01', topic: 'tfl-formalization', subskill: 'main-connective', difficulty: 'introductory', kind: 'choice',
    prompt: 'What is the main connective of ¬A ∨ (B → C)?', options: ['¬', '∨', '→', 'There is no connective'], answer: 1,
    explanation: 'The disjunction divides the entire formula into ¬A and (B → C), so ∨ is the main connective.',
    hints: ['Find the connective with the widest scope.', 'Ignore connectives inside a parenthesized part first.', 'The formula’s two largest components are ¬A and (B → C).'], sourceChapter: 'Ch. 6', attributionStatus: 'original',
  },
  {
    id: 'main-connective-02', topic: 'tfl-formalization', subskill: 'main-connective', difficulty: 'intermediate', kind: 'choice',
    prompt: 'What is the main connective of ¬((A ∧ B) → C)?', options: ['¬', '∧', '→', '⊥'], answer: 0,
    explanation: 'The initial negation has scope over the entire conditional, making ¬ the main connective.',
    hints: ['Look at what applies to the entire remaining formula.', 'The outermost symbol is not inside parentheses.', 'The whole conditional is negated.'], sourceChapter: 'Ch. 6', attributionStatus: 'original',
  },
  {
    id: 'wff-01', topic: 'tfl-formalization', subskill: 'tfl-wff', difficulty: 'introductory', kind: 'choice',
    prompt: 'Which expression is a well-formed TFL formula?', options: ['A ∧', '→ A B', '¬(A ∨ B)', '(A B)'], answer: 2,
    explanation: '¬(A ∨ B) is built recursively from atomic formulas using a binary connective and negation.',
    hints: ['Each binary connective needs a formula on both sides.', 'Parentheses cannot replace a connective.', 'Check the negated disjunction.'], sourceChapter: 'Ch. 6', attributionStatus: 'adapted',
  },
  {
    id: 'scope-01', topic: 'tfl-formalization', subskill: 'tfl-scope', difficulty: 'intermediate', kind: 'choice',
    prompt: 'In A → (B ∨ C), what is the scope of ∨?', options: ['A', 'B ∨ C', 'The entire conditional', 'C only'], answer: 1,
    explanation: 'The occurrence of ∨ combines B and C, so its scope is the subformula B ∨ C.',
    hints: ['Scope is the smallest complete formula governed by the connective.', 'The connective sits inside the consequent.', 'Its immediate left and right components are B and C.'], sourceChapter: 'Ch. 6', attributionStatus: 'original',
  },
  {
    id: 'fol-all-01', topic: 'fol-symbolization', subskill: 'quantifier-symbolization', difficulty: 'introductory', kind: 'formula',
    prompt: 'Translate: “All philosophers are readers.”', language: 'fol', symbolizationKey: ['P(x): x is a philosopher.', 'R(x): x is a reader.'], accepted: ['∀x(P(x) → R(x))'],
    explanation: 'A universal conditional says that every object that is a philosopher is also a reader.',
    hints: ['Use a universal quantifier.', 'Being a philosopher is the condition.', '∀x(P(x) → R(x)).'], sourceChapter: 'Ch. 24', attributionStatus: 'adapted',
  },
  {
    id: 'fol-some-01', topic: 'fol-symbolization', subskill: 'quantifier-symbolization', difficulty: 'introductory', kind: 'formula',
    prompt: 'Translate: “Some philosopher is a reader.”', language: 'fol', symbolizationKey: ['P(x): x is a philosopher.', 'R(x): x is a reader.'], accepted: ['∃x(P(x) ∧ R(x))'],
    explanation: 'An existential conjunction requires one object to satisfy both predicates.',
    hints: ['Use an existential quantifier.', 'The same witness must satisfy both predicates.', '∃x(P(x) ∧ R(x)).'], sourceChapter: 'Ch. 24', attributionStatus: 'adapted',
  },
  {
    id: 'fol-none-01', topic: 'fol-symbolization', subskill: 'quantifier-symbolization', difficulty: 'intermediate', kind: 'formula',
    prompt: 'Translate: “No philosophers are robots.”', language: 'fol', symbolizationKey: ['P(x): x is a philosopher.', 'R(x): x is a robot.'], accepted: ['∀x(P(x) → ¬R(x))', '¬∃x(P(x) ∧ R(x))'],
    explanation: 'The sentence rules out an object that is both a philosopher and a robot.',
    hints: ['You may express this universally or deny an existential overlap.', 'For every philosopher, being a robot is false.', '∀x(P(x) → ¬R(x)).'], sourceChapter: 'Appendix C.2', attributionStatus: 'adapted',
  },
  {
    id: 'multiple-01', topic: 'fol-symbolization', subskill: 'multiple-generality', difficulty: 'intermediate', kind: 'formula',
    prompt: 'Translate: “Everyone admires someone.”', language: 'fol', symbolizationKey: ['A(x,y): x admires y.'], accepted: ['∀x∃yA(x,y)'],
    explanation: 'Each object must have at least one (possibly different) object it admires, so ∀ precedes ∃.',
    hints: ['Start with each possible admirer.', 'The admired object may depend on the admirer.', 'Use ∀x∃y, not ∃y∀x.'], sourceChapter: 'Ch. 25', attributionStatus: 'adapted',
  },
  {
    id: 'multiple-02', topic: 'fol-symbolization', subskill: 'multiple-generality', difficulty: 'advanced', kind: 'formula',
    prompt: 'Translate: “Someone admires everyone.”', language: 'fol', symbolizationKey: ['A(x,y): x admires y.'], accepted: ['∃x∀yA(x,y)'],
    explanation: 'One fixed witness is asserted to admire every object, so ∃ precedes ∀.',
    hints: ['The same admirer works for everyone.', 'Choose the admirer before ranging over admired objects.', 'Use ∃x∀y.'], sourceChapter: 'Ch. 25', attributionStatus: 'adapted',
  },
  {
    id: 'identity-01', topic: 'fol-symbolization', subskill: 'identity', difficulty: 'introductory', kind: 'formula',
    prompt: 'Translate: “Ada is not Bo.”', language: 'fol', symbolizationKey: ['a: Ada.', 'b: Bo.'], accepted: ['¬a = b', 'a ≠ b'],
    explanation: 'Distinctness is represented by negating identity: ¬a = b.',
    hints: ['Use the identity symbol between the two names.', 'Then deny that identity.', '¬a = b.'], sourceChapter: 'Ch. 26', attributionStatus: 'adapted',
  },
  {
    id: 'identity-02', topic: 'fol-symbolization', subskill: 'identity', difficulty: 'advanced', kind: 'formula',
    prompt: 'Translate: “Only Ada is a logician.”', language: 'fol', symbolizationKey: ['a: Ada.', 'L(x): x is a logician.'], accepted: ['∀x(L(x) ↔ x = a)'],
    explanation: 'The biconditional says an object is a logician exactly when it is identical to Ada.',
    hints: ['“Only Ada” contains existence and uniqueness information.', 'Characterize every logician as identical to Ada and Ada as a logician.', 'Use ∀x(L(x) ↔ x = a).'], sourceChapter: 'Appendix C.2', attributionStatus: 'adapted',
  },
  {
    id: 'qscope-01', topic: 'fol-symbolization', subskill: 'quantifier-scope', difficulty: 'intermediate', kind: 'choice',
    prompt: 'Which formula says that not every philosopher reads?', options: ['∀x(P(x) → ¬R(x))', '¬∀x(P(x) → R(x))', '∀x¬P(x) → R(x)', '¬∃x(P(x) ∧ R(x))'], answer: 1,
    explanation: 'The negation has scope over the universal claim. It is equivalent to saying some philosopher does not read.',
    hints: ['Distinguish “not every” from “none.”', 'Negate the entire universal statement.', 'Place ¬ before ∀.'], sourceChapter: 'Ch. 29', attributionStatus: 'adapted',
  },
  {
    id: 'truth-connective-01', topic: 'truth-tables', subskill: 'connective-values', difficulty: 'introductory', kind: 'choice',
    prompt: 'If A is false and B is true, what is the value of A → B?', options: ['True', 'False', 'Undetermined', 'Both true and false'], answer: 0,
    explanation: 'A conditional is false only when its antecedent is true and its consequent false. A false antecedent makes it true.',
    hints: ['Recall the one false row of the conditional.', 'Check whether the antecedent is true.', 'A false antecedent is enough for a true material conditional.'], sourceChapter: 'Appendix C.1', attributionStatus: 'adapted',
  },
  {
    id: 'truth-connective-02', topic: 'truth-tables', subskill: 'connective-values', difficulty: 'intermediate', kind: 'choice',
    prompt: 'If A is true and B is false, what is the value of ¬A ∨ B?', options: ['True', 'False', 'Undetermined', 'It depends on another atom'], answer: 1,
    explanation: '¬A is false and B is false, so the disjunction has two false disjuncts.',
    hints: ['Evaluate the negation first.', 'Both disjuncts must then be checked.', '¬T is F, and F ∨ F is F.'], sourceChapter: 'Ch. 10', attributionStatus: 'original',
  },
  {
    id: 'truth-class-01', topic: 'truth-tables', subskill: 'classification', difficulty: 'introductory', kind: 'choice',
    prompt: 'How should A ∨ ¬A be classified?', options: ['Tautology', 'Contradiction', 'Contingent', 'Invalid'], answer: 0,
    explanation: 'For every valuation, either A or its negation is true, so the formula is true on every row.',
    hints: ['List the two possible values of A.', 'Check the main column on every row.', 'The main column never contains F.'], sourceChapter: 'Ch. 12', attributionStatus: 'adapted',
  },
  {
    id: 'truth-class-02', topic: 'truth-tables', subskill: 'classification', difficulty: 'intermediate', kind: 'choice',
    prompt: 'How should (A → B) ∧ A be classified?', options: ['Tautology', 'Contradiction', 'Contingent', 'Logically equivalent to ⊥'], answer: 2,
    explanation: 'The formula is true when A and B are true, but false on other rows, so it is contingent.',
    hints: ['A contingent formula is true on some rows and false on others.', 'Try A: T, B: T.', 'Then try A: F.'], sourceChapter: 'Ch. 12', attributionStatus: 'original',
  },
  {
    id: 'truth-semantics-01', topic: 'truth-tables', subskill: 'semantic-tests', difficulty: 'intermediate', kind: 'choice',
    prompt: 'Are A → B and ¬A ∨ B logically equivalent?', options: ['Yes, their truth values match on every valuation.', 'No, they differ when A and B are true.', 'No, they differ when A is false.', 'Only if A and B are both true.'], answer: 0,
    explanation: 'The two formulas have the same main-column value on all four valuations.',
    hints: ['Equivalence requires matching values on every row.', 'Focus on the false row of A → B.', '¬A ∨ B is also false only when A is true and B false.'], sourceChapter: 'Ch. 12', attributionStatus: 'adapted',
  },
  {
    id: 'truth-semantics-02', topic: 'truth-tables', subskill: 'semantic-tests', difficulty: 'advanced', kind: 'choice',
    prompt: 'Which row is a counterexample to the argument A ∨ B, A → C, B → C ∴ C?', options: ['A:T, B:T, C:T', 'A:T, B:F, C:F', 'A:F, B:T, C:F', 'There is no counterexample row.'], answer: 3,
    explanation: 'If A is true, A → C forces C true; if B is true, B → C forces C true. Since A ∨ B is true, C cannot be false while all premises are true.',
    hints: ['A counterexample needs every premise true and C false.', 'Set C false and inspect each conditional.', 'With C false, both conditionals force A and B false, contradicting A ∨ B.'], sourceChapter: 'Ch. 13', attributionStatus: 'original',
  },
]

const truthFormulaPools: Record<Difficulty, string[]> = {
  introductory: ['A ∧ B', 'A ∨ B', 'A → B', '¬A', 'A ↔ B'],
  intermediate: ['(A → B) ∧ A', '¬(A ∨ B)', '(A ∧ B) → A', 'A ∨ ¬A', '(A → B) ↔ (¬A ∨ B)'],
  advanced: ['((A → B) ∧ (B → C)) → (A → C)', '(A ∨ B) ∧ ¬A', '¬(A ∧ B) ↔ (¬A ∨ ¬B)', '(A ↔ B) ↔ ((A → B) ∧ (B → A))', '((A ∨ B) ∧ (A → C)) ∧ (B → C)'],
}

function seededIndex(seed: number, length: number) {
  const value = Math.sin(seed * 9301 + 49297) * 233280
  return Math.abs(Math.floor(value)) % length
}

export function generatedTruthExercise(seed: number, difficulty: Difficulty): TruthTableExercise {
  const pool = truthFormulaPools[difficulty]
  const formula = pool[seededIndex(seed, pool.length)]
  return {
    id: `truth-generated-${difficulty}-${seed}`, topic: 'truth-tables', subskill: 'complete-table', difficulty, kind: 'truth-table', formula,
    prompt: `Complete the truth table for ${formula}.`,
    explanation: 'Compute inner dependencies before the main-connective column. The table is graded left to right by dependency.',
    hints: ['Start with the atomic columns already provided.', 'Complete the simplest subformula before any formula that depends on it.', 'Use the characteristic truth table for the main connective.'], sourceChapter: 'Ch. 11–12', attributionStatus: 'original',
  }
}

export const proofExercises: ProofExercise[] = [
  { id: 'proof-r-01', topic: 'tfl-basic', subskill: 'R', difficulty: 'introductory', kind: 'proof', premises: ['A'], conclusion: 'A', prompt: 'Reiterate A at a later line.', explanation: 'R repeats an accessible earlier formula.', hints: ['The premise already has the target formula.', 'Use R.', 'Cite line 1.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-and-01', topic: 'tfl-basic', subskill: 'and-rules', difficulty: 'introductory', kind: 'proof', premises: ['A ∧ B'], conclusion: 'B', prompt: 'Derive B from A ∧ B.', explanation: 'Use conjunction elimination on the premise.', hints: ['Inspect the main connective of the premise.', '∧E extracts either conjunct.', 'Cite line 1 with ∧E.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-or-01', topic: 'tfl-basic', subskill: 'or-rules', difficulty: 'introductory', kind: 'proof', premises: ['A'], conclusion: 'A ∨ B', prompt: 'Derive A ∨ B from A.', explanation: 'Disjunction introduction adds either disjunct.', hints: ['The conclusion contains the premise as one disjunct.', 'Use ∨I.', 'Cite line 1.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-iff-01', topic: 'tfl-basic', subskill: 'iff-rules', difficulty: 'intermediate', kind: 'proof', premises: ['A ↔ B', 'A'], conclusion: 'B', prompt: 'Derive B from A ↔ B and A.', explanation: 'Biconditional elimination uses the biconditional and either side.', hints: ['One premise links A and B in both directions.', 'Use ↔E.', 'Cite the biconditional and A.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-x-01', topic: 'tfl-basic', subskill: 'X', difficulty: 'introductory', kind: 'proof', premises: ['⊥'], conclusion: 'C', prompt: 'Derive C from ⊥.', explanation: 'Explosion permits any formula from contradiction.', hints: ['The premise is bottom.', 'Use X.', 'Cite line 1.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-impi-01', topic: 'tfl-conditional', subskill: 'impI', difficulty: 'intermediate', kind: 'proof', premises: [], conclusion: 'A → A', prompt: 'Derive A → A with a subproof.', explanation: 'Assume A, reiterate it, then discharge the subproof with →I.', hints: ['A conditional conclusion suggests →I.', 'Open a subproof by assuming A.', 'Reiterate A, close the subproof, and cite its range.'], sourceChapter: 'Ch. 17–18', attributionStatus: 'adapted' },
  { id: 'proof-conditional-01', topic: 'tfl-conditional', subskill: 'impE', difficulty: 'introductory', kind: 'proof', premises: ['A → B', 'A'], conclusion: 'B', prompt: 'Derive B from A → B and A.', explanation: 'Conditional elimination applies to a conditional and its antecedent.', hints: ['Match the antecedent to another premise.', 'Use →E.', 'Cite the conditional and A.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-noti-01', topic: 'tfl-negation', subskill: 'notI', difficulty: 'advanced', kind: 'proof', premises: ['A → ⊥'], conclusion: '¬A', prompt: 'Derive ¬A from A → ⊥.', explanation: 'Assume A, derive ⊥ by →E, then use ¬I on the subproof.', hints: ['A negation conclusion suggests ¬I.', 'Assume A.', 'Apply →E to reach ⊥ and cite the subproof range with ¬I.'], sourceChapter: 'Ch. 17–18', attributionStatus: 'adapted' },
  { id: 'proof-negation-01', topic: 'tfl-negation', subskill: 'notE', difficulty: 'introductory', kind: 'proof', premises: ['¬A', 'A'], conclusion: '⊥', prompt: 'Derive a contradiction from A and ¬A.', explanation: 'Negation elimination yields ⊥ from a formula and its negation.', hints: ['The premises directly conflict.', 'Use ¬E.', 'Cite both premises.'], sourceChapter: 'Ch. 17', attributionStatus: 'adapted' },
  { id: 'proof-ip-01', topic: 'tfl-negation', subskill: 'IP', difficulty: 'advanced', kind: 'proof', premises: ['¬¬A'], conclusion: 'A', prompt: 'Derive A using indirect proof.', explanation: 'Assume ¬A, derive ⊥ with ¬¬A, then discharge with IP.', hints: ['IP assumes the negation of the target.', 'Assume ¬A.', 'Use ¬E with ¬¬A, then cite the subproof with IP.'], sourceChapter: 'Ch. 19', attributionStatus: 'adapted' },
  { id: 'proof-derived-01', topic: 'tfl-negation', subskill: 'derived-tfl', difficulty: 'intermediate', kind: 'proof', premises: ['A ∨ B', '¬A'], conclusion: 'B', prompt: 'Derive B using a permitted derived rule.', explanation: 'Disjunctive syllogism removes the negated disjunct.', hints: ['One disjunct has been denied.', 'Use DS.', 'Cite A ∨ B and ¬A.'], sourceChapter: 'Ch. 21', attributionStatus: 'adapted' },
  { id: 'proof-forall-01', topic: 'fol-proofs', subskill: 'forall-rules', difficulty: 'intermediate', kind: 'proof', premises: ['∀x(P(x) → Q(x))', 'P(a)'], conclusion: 'Q(a)', prompt: 'Use universal elimination and conditional elimination to derive Q(a).', explanation: 'Instantiate the universal at a, then apply →E.', hints: ['First obtain P(a) → Q(a).', 'Use ∀E.', 'Then cite P(a) with →E.'], sourceChapter: 'Ch. 36–37', attributionStatus: 'adapted' },
  { id: 'proof-exists-01', topic: 'fol-proofs', subskill: 'exists-rules', difficulty: 'intermediate', kind: 'proof', premises: ['P(a) ∧ Q(a)'], conclusion: '∃xQ(x)', prompt: 'Derive ∃xQ(x).', explanation: 'Extract Q(a), then use existential introduction.', hints: ['Obtain one conjunct first.', 'Use ∧E, then ∃I.', 'Q(a) is an instance of ∃xQ(x).'], sourceChapter: 'Ch. 36', attributionStatus: 'adapted' },
  { id: 'proof-identity-01', topic: 'fol-proofs', subskill: 'identity-rules', difficulty: 'intermediate', kind: 'proof', premises: ['a = b', 'P(a)'], conclusion: 'P(b)', prompt: 'Substitute identical names to derive P(b).', explanation: '=E permits substitution of one identical name for the other.', hints: ['The first premise identifies the denotations.', 'Use =E on both premises.', 'Replace a by b in P(a).'], sourceChapter: 'Ch. 39', attributionStatus: 'adapted' },
  { id: 'proof-cq-01', topic: 'fol-proofs', subskill: 'CQ', difficulty: 'intermediate', kind: 'proof', premises: ['¬∀xP(x)'], conclusion: '∃x¬P(x)', prompt: 'Convert the negated universal using CQ.', explanation: 'Quantifier conversion changes ¬∀xP(x) to ∃x¬P(x).', hints: ['A negated universal becomes an existential.', 'Move the negation into the quantified formula.', 'Use CQ on line 1.'], sourceChapter: 'Ch. 38', attributionStatus: 'adapted' },
]

export const modelExercises: ModelExercise[] = [
  { id: 'model-eval-01', topic: 'fol-models', subskill: 'model-evaluation', difficulty: 'introductory', kind: 'model', formula: '∃xP(x)', model: { domain: ['Ada', 'Bo'], names: { a: 'Ada', b: 'Bo' }, predicates: { P: [['Ada']], R: [['Ada', 'Bo']] } }, expected: true, prompt: 'Evaluate ∃xP(x) in the supplied model.', explanation: 'Ada witnesses P, so the existential is true.', hints: ['Check the extension of P.', 'An existential needs one witness.', 'Ada is in P.'], sourceChapter: 'Ch. 31', attributionStatus: 'adapted' },
  { id: 'model-eval-02', topic: 'fol-models', subskill: 'model-evaluation', difficulty: 'intermediate', kind: 'model', formula: '∀xP(x)', model: { domain: ['Ada', 'Bo'], names: { a: 'Ada', b: 'Bo' }, predicates: { P: [['Ada']], R: [['Ada', 'Bo']] } }, expected: false, prompt: 'Evaluate ∀xP(x) in the supplied model.', explanation: 'Bo is a counterexample because Bo is in the domain but not in P.', hints: ['A universal must hold for every domain object.', 'Check Bo as well as Ada.', 'Bo is not in the extension of P.'], sourceChapter: 'Ch. 31', attributionStatus: 'adapted' },
  { id: 'model-construct-01', topic: 'fol-models', subskill: 'model-construction', difficulty: 'intermediate', kind: 'model', formula: '∃x(P(x) ∧ ¬Q(x))', model: { domain: ['Ada', 'Bo'], names: { a: 'Ada' }, predicates: { P: [['Ada']], Q: [['Bo']] } }, expected: true, prompt: 'Does this interpretation satisfy ∃x(P(x) ∧ ¬Q(x))?', explanation: 'Ada is in P and not in Q, so Ada witnesses the existential. Edit the interpretation in the workspace to construct alternatives.', hints: ['Look for one object in P but not Q.', 'Compare the two unary extensions.', 'Ada is the witness.'], sourceChapter: 'Ch. 33', attributionStatus: 'original' },
  { id: 'model-counter-01', topic: 'fol-models', subskill: 'countermodels', difficulty: 'advanced', kind: 'model', formula: '∀x(P(x) → Q(x))', model: { domain: ['Ada', 'Bo'], names: { a: 'Ada', b: 'Bo' }, predicates: { P: [['Ada'], ['Bo']], Q: [['Ada']] } }, expected: false, prompt: 'Is this a countermodel to the universal claim ∀x(P(x) → Q(x))?', explanation: 'Bo belongs to P but not Q, making the universal conditional false; the model is a countermodel to that sentence.', hints: ['A false universal needs one counterexample object.', 'Find an object in P but outside Q.', 'Bo makes P true and Q false.'], sourceChapter: 'Ch. 33–34', attributionStatus: 'original' },
]
