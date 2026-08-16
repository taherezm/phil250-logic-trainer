import type { Difficulty } from '../content/exercises'

export interface AttemptRecord {
  id: string
  exerciseId: string
  topic: string
  subskill: string
  difficulty: Difficulty
  correct: boolean
  attempts: number
  hintsUsed: number
  answer: string
  expected: string
  timestamp: string
  review: boolean
}

export interface SessionDraft {
  exerciseIds: string[]
  selectedSubskills: string[]
  difficulty: Difficulty | 'mixed'
  length: 5 | 10 | 20
  mode: 'guided' | 'practice' | 'test'
  index: number
  savedAt: string
}

const ATTEMPTS_KEY = 'logic-trainer:attempts:v1'
const SESSION_KEY = 'logic-trainer:session:v1'

function safelyParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function loadAttempts(): AttemptRecord[] {
  if (typeof localStorage === 'undefined') return []
  return safelyParse<AttemptRecord[]>(localStorage.getItem(ATTEMPTS_KEY), [])
}

export function recordAttempt(attempt: Omit<AttemptRecord, 'id' | 'timestamp' | 'review'>): AttemptRecord {
  const record: AttemptRecord = { ...attempt, id: `${attempt.exerciseId}-${Date.now()}`, timestamp: new Date().toISOString(), review: !attempt.correct }
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([record, ...loadAttempts()].slice(0, 500)))
  return record
}

export function setReviewState(id: string, review: boolean) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(loadAttempts().map((attempt) => attempt.id === id ? { ...attempt, review } : attempt)))
}

export function saveSessionDraft(draft: SessionDraft) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(draft))
}

export function loadSessionDraft(): SessionDraft | null {
  if (typeof localStorage === 'undefined') return null
  return safelyParse<SessionDraft | null>(localStorage.getItem(SESSION_KEY), null)
}

export function clearSessionDraft() {
  localStorage.removeItem(SESSION_KEY)
}
