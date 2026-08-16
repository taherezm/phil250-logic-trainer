import { useMemo } from 'react'
import { normalizeFOLInput, parseFOL, renderFOL } from '../logic/fol/parser'
import { normalizeTFLInput, parseTFL, renderTFL } from '../logic/tfl/parser'

interface FormulaInputProps {
  id: string
  language: 'tfl' | 'fol'
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function FormulaInput({ id, language, value, onChange, disabled, autoFocus }: FormulaInputProps) {
  const preview = useMemo(() => {
    if (!value.trim()) return { normalized: '', error: '' }
    try {
      return language === 'tfl'
        ? { normalized: renderTFL(parseTFL(value)), error: '' }
        : { normalized: renderFOL(parseFOL(value)), error: '' }
    } catch (error) {
      return { normalized: language === 'tfl' ? normalizeTFLInput(value) : normalizeFOLInput(value), error: error instanceof Error ? error.message : 'The formula cannot be parsed.' }
    }
  }, [language, value])

  return (
    <div className="formula-entry">
      <input id={id} className="formula-input" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} autoFocus={autoFocus} autoComplete="off" spellCheck={false} aria-describedby={`${id}-preview ${id}-help`} />
      <p id={`${id}-preview`} className={`formula-preview ${preview.error ? 'has-error' : ''}`} aria-live="polite">
        {preview.normalized || 'Normalized formula appears here.'}
      </p>
      <p id={`${id}-help`} className="input-help">Keyboard: ~ / not, &amp; / /\, | / \/, -&gt;, &lt;-&gt;, _|_{language === 'fol' ? ', forall, exists' : ''}</p>
      {preview.error && <p className="field-error">{preview.error}</p>}
    </div>
  )
}
