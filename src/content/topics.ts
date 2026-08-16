export interface Subskill {
  id: string
  label: string
  engine: 'curated' | 'truth-table' | 'proof' | 'model'
}

export interface Topic {
  id: string
  label: string
  description: string
  subskills: Subskill[]
}

export interface TopicGroup {
  id: string
  label: string
  topics: Topic[]
}

export const topicGroups: TopicGroup[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    topics: [
      { id: 'arguments', label: 'Arguments and Validity', description: 'Premises, conclusions, validity, soundness, and counterexamples.', subskills: [
        { id: 'argument-parts', label: 'Premises and conclusions', engine: 'curated' },
        { id: 'validity-concepts', label: 'Validity, truth, and soundness', engine: 'curated' },
        { id: 'counterexamples', label: 'Counterexamples', engine: 'curated' },
      ] },
      { id: 'tfl-formalization', label: 'TFL Formalization', description: 'Symbolization, syntax, scope, and ambiguity.', subskills: [
        { id: 'tfl-translation', label: 'English to TFL', engine: 'curated' },
        { id: 'main-connective', label: 'Main connective', engine: 'curated' },
        { id: 'tfl-wff', label: 'Well-formed formulas', engine: 'curated' },
        { id: 'tfl-scope', label: 'Structure and scope', engine: 'curated' },
      ] },
      { id: 'truth-tables', label: 'Truth Tables', description: 'Complete tables and test semantic properties.', subskills: [
        { id: 'connective-values', label: 'Connective values', engine: 'truth-table' },
        { id: 'complete-table', label: 'Complete truth tables', engine: 'truth-table' },
        { id: 'classification', label: 'Tautology, contradiction, contingency', engine: 'truth-table' },
        { id: 'semantic-tests', label: 'Equivalence, consistency, and validity', engine: 'truth-table' },
      ] },
    ],
  },
  {
    id: 'tfl-proofs',
    label: 'TFL Natural Deduction',
    topics: [
      { id: 'tfl-basic', label: 'Basic TFL Proof Rules', description: 'Reiteration, conjunction, disjunction, biconditional, and explosion.', subskills: [
        { id: 'R', label: 'Reiteration (R)', engine: 'proof' }, { id: 'and-rules', label: '∧I / ∧E', engine: 'proof' },
        { id: 'or-rules', label: '∨I / ∨E', engine: 'proof' }, { id: 'iff-rules', label: '↔I / ↔E', engine: 'proof' },
        { id: 'X', label: 'Explosion (X)', engine: 'proof' },
      ] },
      { id: 'tfl-conditional', label: 'Conditional TFL Proof Rules', description: 'Conditional introduction and elimination.', subskills: [
        { id: 'impI', label: '→I', engine: 'proof' }, { id: 'impE', label: '→E', engine: 'proof' },
      ] },
      { id: 'tfl-negation', label: 'Negation TFL Proof Rules', description: 'Negation, indirect proof, and configurable derived rules.', subskills: [
        { id: 'notI', label: '¬I', engine: 'proof' }, { id: 'notE', label: '¬E', engine: 'proof' },
        { id: 'IP', label: 'Indirect proof (IP)', engine: 'proof' }, { id: 'derived-tfl', label: 'DS, MT, DNE, DeM, LEM', engine: 'proof' },
      ] },
    ],
  },
  {
    id: 'fol',
    label: 'First-Order Logic',
    topics: [
      { id: 'fol-symbolization', label: 'FOL Symbolization', description: 'Quantifiers, identity, multiple generality, and scope.', subskills: [
        { id: 'quantifier-symbolization', label: 'All, some, and none', engine: 'curated' },
        { id: 'multiple-generality', label: 'Multiple generality', engine: 'curated' },
        { id: 'identity', label: 'Identity and distinctness', engine: 'curated' },
        { id: 'quantifier-scope', label: 'Quantifier scope and ambiguity', engine: 'curated' },
      ] },
      { id: 'fol-models', label: 'FOL Models', description: 'Evaluate and construct finite interpretations.', subskills: [
        { id: 'model-evaluation', label: 'Sentence evaluation', engine: 'model' },
        { id: 'model-construction', label: 'Satisfying models', engine: 'model' },
        { id: 'countermodels', label: 'Countermodels', engine: 'model' },
      ] },
      { id: 'fol-proofs', label: 'FOL Proofs', description: 'Quantifier and identity rules with name restrictions.', subskills: [
        { id: 'forall-rules', label: '∀E / ∀I', engine: 'proof' }, { id: 'exists-rules', label: '∃I / ∃E', engine: 'proof' },
        { id: 'identity-rules', label: '=I / =E', engine: 'proof' }, { id: 'CQ', label: 'Quantifier conversion (CQ)', engine: 'proof' },
      ] },
    ],
  },
]

export const allTopics = topicGroups.flatMap((group) => group.topics)
export const allSubskills = allTopics.flatMap((topic) => topic.subskills)
