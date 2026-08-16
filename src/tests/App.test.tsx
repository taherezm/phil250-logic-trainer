import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('Logic Trainer interface', () => {
  beforeEach(() => localStorage.clear())

  it('shows every subject group and topic without locks', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Foundations' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'TFL Natural Deduction' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'First-Order Logic' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FOL Proofs' })).toBeInTheDocument()
    expect(screen.queryByText(/locked|week \d|prerequisite/i)).not.toBeInTheDocument()
  })

  it('configures a set from a single topic quick action', async () => {
    const user = userEvent.setup()
    render(<App />)
    const cards = screen.getAllByRole('article')
    const formalization = cards.find((card) => card.textContent?.includes('TFL Formalization'))!
    await user.click(withinButton(formalization, 'Practice this topic →'))
    expect(screen.getByRole('heading', { name: 'Configure the set.' })).toBeInTheDocument()
    expect(screen.getAllByText('English to TFL').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Begin set' })).toBeEnabled()
  })

  it('opens functional proof and model workspaces', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Proof workspace' }))
    expect(screen.getByRole('region', { name: 'Fitch proof editor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check proof' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Model workspace' }))
    expect(screen.getByRole('button', { name: 'Evaluate in model' })).toBeEnabled()
  })
})

function withinButton(element: HTMLElement, name: string) {
  const button = [...element.querySelectorAll('button')].find((item) => item.textContent === name)
  if (!button) throw new Error(`Button ${name} not found`)
  return button
}
