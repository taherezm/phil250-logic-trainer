export type RuleGroupId = 'basic' | 'conditional' | 'negation' | 'derived' | 'quantifiers' | 'identity'

export interface ProofRuleDefinition {
  id: string
  label: string
  group: RuleGroupId
  citations: 'none' | 'lines' | 'range' | 'mixed'
  description: string
}

export const proofRuleGroups: Array<{ id: RuleGroupId; label: string }> = [
  { id: 'basic', label: 'Basic TFL' },
  { id: 'conditional', label: 'Conditional' },
  { id: 'negation', label: 'Negation' },
  { id: 'derived', label: 'Derived (configurable)' },
  { id: 'quantifiers', label: 'Quantifiers' },
  { id: 'identity', label: 'Identity' },
]

export const proofRules: ProofRuleDefinition[] = [
  { id: 'PR', label: 'PR — Premise', group: 'basic', citations: 'none', description: 'Initial premise' },
  { id: 'AS', label: 'AS — Assumption', group: 'basic', citations: 'none', description: 'Open a subproof' },
  { id: 'R', label: 'R — Reiteration', group: 'basic', citations: 'lines', description: 'Repeat an accessible line' },
  { id: '∧I', label: '∧I', group: 'basic', citations: 'lines', description: 'Conjunction introduction' },
  { id: '∧E', label: '∧E', group: 'basic', citations: 'lines', description: 'Conjunction elimination' },
  { id: '∨I', label: '∨I', group: 'basic', citations: 'lines', description: 'Disjunction introduction' },
  { id: '∨E', label: '∨E', group: 'basic', citations: 'mixed', description: 'Disjunction elimination' },
  { id: '↔I', label: '↔I', group: 'basic', citations: 'range', description: 'Biconditional introduction' },
  { id: '↔E', label: '↔E', group: 'basic', citations: 'lines', description: 'Biconditional elimination' },
  { id: 'X', label: 'X — Explosion', group: 'basic', citations: 'lines', description: 'Infer any formula from ⊥' },
  { id: '→I', label: '→I', group: 'conditional', citations: 'range', description: 'Conditional introduction' },
  { id: '→E', label: '→E', group: 'conditional', citations: 'lines', description: 'Conditional elimination' },
  { id: '¬I', label: '¬I', group: 'negation', citations: 'range', description: 'Negation introduction' },
  { id: '¬E', label: '¬E', group: 'negation', citations: 'lines', description: 'Negation elimination' },
  { id: 'IP', label: 'IP — Indirect proof', group: 'negation', citations: 'range', description: 'Classical indirect proof' },
  { id: 'DS', label: 'DS', group: 'derived', citations: 'lines', description: 'Disjunctive syllogism' },
  { id: 'MT', label: 'MT', group: 'derived', citations: 'lines', description: 'Modus tollens' },
  { id: 'DNE', label: 'DNE', group: 'derived', citations: 'lines', description: 'Double-negation elimination' },
  { id: 'DeM', label: 'DeM', group: 'derived', citations: 'lines', description: 'De Morgan rules' },
  { id: 'LEM', label: 'LEM', group: 'derived', citations: 'range', description: 'Excluded middle proof pattern' },
  { id: '∀E', label: '∀E', group: 'quantifiers', citations: 'lines', description: 'Universal elimination' },
  { id: '∀I', label: '∀I', group: 'quantifiers', citations: 'lines', description: 'Universal introduction; name must be arbitrary' },
  { id: '∃I', label: '∃I', group: 'quantifiers', citations: 'lines', description: 'Existential introduction' },
  { id: '∃E', label: '∃E', group: 'quantifiers', citations: 'mixed', description: 'Existential elimination; witness must be fresh' },
  { id: 'CQ', label: 'CQ', group: 'quantifiers', citations: 'lines', description: 'Conversion of quantifiers' },
  { id: '=I', label: '=I', group: 'identity', citations: 'none', description: 'Identity introduction' },
  { id: '=E', label: '=E', group: 'identity', citations: 'lines', description: 'Identity elimination' },
]
