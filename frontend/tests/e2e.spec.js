// Basic E2E checks for Demo ON
import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try { 
      localStorage.setItem('demo_mode', '1')
      localStorage.setItem('auth_token', 'test-token')
    } catch {}
  })
})

test('Heatmap tab shows single button and no slider', async ({ page }) => {
  await page.goto('/dashboard/time-machine')
  await page.getByRole('button', { name: 'Heatmap' }).click()
  const btns = await page.getByRole('button', { name: 'Afișează heatmap' }).all()
  expect(btns.length).toBe(1)
  await expect(page.locator('input[type="range"]')).toHaveCount(0)
})

test('Replay tab has a single "Redă traseul" button in controls', async ({ page }) => {
  await page.goto('/dashboard/time-machine')
  await page.getByRole('button', { name: 'Redare traseu' }).click()
  const run = page.getByRole('button', { name: 'Redă traseul' })
  await expect(run).toHaveCount(1)
})

test('Alerts page shows only history (no settings)', async ({ page }) => {
  await page.goto('/dashboard/alerts')
  await expect(page.getByRole('heading', { name: /Istoric alerte/i })).toBeVisible()
  await expect(page.getByText(/Setări notificări/i)).toHaveCount(0)
})

test('Profile/logout button visible in header', async ({ page }) => {
  await page.goto('/dashboard')
  const profileBtns = await page.getByRole('button', { name: /^[A-Z]$/ }).all()
  expect(profileBtns.length).toBeGreaterThan(0)
})

test('Member detail Live toggle shows countdown', async ({ page }) => {
  await page.goto('/dashboard/member')
  await page.getByRole('link', { name: 'Vezi locație & setări' }).first().click()
  // Start Live
  await page.getByRole('button', { name: 'Live' }).click()
  // Expect LIVE badge and countdown to appear
  const stopBtn = page.getByRole('button', { name: 'Oprește' })
  await expect(stopBtn).toBeVisible()
  const actionRow = stopBtn.locator('..')
  await expect(actionRow.getByText('LIVE')).toBeVisible()
  await expect(actionRow.getByText(/\d+:\d{2}/).first()).toBeVisible()
})

test('Heatmap loads demo badge after click', async ({ page }) => {
  await page.goto('/dashboard/time-machine')
  await page.getByRole('button', { name: 'Heatmap' }).click()
  await page.getByRole('button', { name: 'Afișează heatmap' }).click()
  await expect(page.getByText(/Heatmap demo \(fără Orange\/DB\)/)).toBeVisible()
})

test('Free-hand route can be created and appears in list', async ({ page }) => {
  await page.goto('/dashboard/member')
  await page.getByRole('link', { name: 'Vezi locație & setări' }).first().click()
  const traseeSection = page.getByRole('heading', { name: 'Trasee' }).locator('xpath=..')
  await traseeSection.getByRole('button', { name: '+ Adaugă' }).click()
  await page.getByRole('button', { name: 'Desenare manuală (free-hand)' }).click()
  await page.getByLabel('Nume traseu').fill('E2E Freehand')
  const map = page.locator('.leaflet-container').first()
  await map.click({ position: { x: 120, y: 120 } })
  await map.click({ position: { x: 220, y: 180 } })
  await page.getByRole('button', { name: 'Salvează traseul desenat' }).click()
  await expect(page.getByText('E2E Freehand')).toBeVisible()
})

test('Alert config: enable staționare and show Safe Zones/minutes', async ({ page }) => {
  await page.goto('/dashboard/member')
  await page.getByRole('link', { name: 'Vezi locație & setări' }).first().click()
  await page.getByText('Staționare prelungită', { exact: true }).click()
  await expect(page.getByText('Safe Zones (nu trimit alertă la staționare):')).toBeVisible()
})

test('Replay export CSV triggers a download', async ({ page, context }) => {
  await page.goto('/dashboard/time-machine')
  // replay is default tab
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Redă traseul' }).click().then(async () => {
      // wait for points to load then click Export CSV
      await page.waitForSelector('text=Export CSV', { state: 'visible' })
      await page.getByRole('button', { name: 'Export CSV' }).click()
    }),
  ])
  const suggested = download.suggestedFilename()
  expect(suggested.endsWith('.csv')).toBeTruthy()
})
