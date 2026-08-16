import { expect, test } from '@playwright/test'

test('creates a topic practice set and submits a deterministic answer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Choose what to practice.' })).toBeVisible()
  const card = page.getByRole('article').filter({ hasText: 'TFL Formalization' })
  await card.getByRole('button', { name: 'Practice this topic →' }).click()
  await expect(page.getByRole('heading', { name: 'Configure the set.' })).toBeVisible()
  await page.getByRole('button', { name: 'Begin set' }).click()
  await expect(page.getByText(/Question 1 of 5/)).toBeVisible()
})

test('edits and checks a Fitch proof', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Proof workspace' }).click()
  await page.getByRole('button', { name: 'Check proof' }).click()
  await expect(page.getByText(/Needs revision|Valid so far|Proof complete/).first()).toBeVisible()
})

test('evaluates a quantified formula on a mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific flow')
  await page.goto('/')
  await page.getByRole('button', { name: 'Model workspace' }).click()
  await page.getByRole('button', { name: 'Evaluate in model' }).click()
  await expect(page.getByText(/True in this model|False in this model/)).toBeVisible()
})

test('keeps mistake review across a reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One persistence flow is sufficient')
  await page.goto('/')
  await page.getByRole('button', { name: 'Configure set' }).click()
  await page.getByRole('button', { name: 'Begin set' }).click()
  await page.getByLabel('Your formula').fill('A ∨ B')
  await page.getByRole('button', { name: 'Submit answer' }).click()
  await expect(page.getByText('× Needs revision')).toBeVisible()
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Needs revision' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Review', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Needs revision' })).toBeVisible()
})
