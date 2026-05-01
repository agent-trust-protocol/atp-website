import { test, expect, Page } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

const main = (page: Page) => page.locator('main, [role="main"], .min-h-screen').first();

async function waitForPreflight(page: Page) {
  await expect(page.getByText('All clear')).toBeVisible({ timeout: 12000 });
}

/** Walk through the new-project wizard up to (but not including) Run Setup */
async function navigateNewWizardToReview(page: Page) {
  await page.goto('/onboard/new');
  await waitForPreflight(page);
  await page.getByRole('button', { name: /Next/ }).click();
  // Wait for step 2 to render before filling
  await expect(page.getByPlaceholder('my-atp-agent')).toBeVisible();
  await page.getByPlaceholder('my-atp-agent').fill('test-agent');
  // Wait for Next to be enabled (React state must update after fill)
  await expect(page.getByRole('button', { name: /Next/ })).toBeEnabled();
  await page.getByRole('button', { name: /Next/ }).click();
  // Wait for step 3 (language) to render
  await expect(page.getByRole('button', { name: /TypeScript/ })).toBeVisible();
  await page.getByRole('button', { name: /Next/ }).click();
  // Wait for step 4 (security) to render
  await expect(page.getByRole('button', { name: /Standard/ })).toBeVisible();
  await page.getByRole('button', { name: /Next/ }).click();
  await expect(page.getByText('Ready to run')).toBeVisible();
}

// ─── /onboard — path selector ─────────────────────────────────────────────────

test.describe('/onboard path selector', () => {
  test('renders all three path cards', async ({ page }) => {
    await page.goto('/onboard');
    await expect(page.getByText('New ATP Project')).toBeVisible();
    await expect(page.getByText('Connect Existing Project')).toBeVisible();
    await expect(page.getByText('Explore the Dashboard')).toBeVisible();
  });

  test('all three cards have CTA buttons', async ({ page }) => {
    await page.goto('/onboard');
    // scope to main to avoid navbar ambiguity
    await expect(main(page).getByRole('link', { name: /Get Started/ })).toBeVisible();
    await expect(main(page).getByRole('link', { name: 'Connect' })).toBeVisible();
    await expect(main(page).getByRole('link', { name: /Open Dashboard/ })).toBeVisible();
  });

  test('Get Started navigates to /onboard/new', async ({ page }) => {
    await page.goto('/onboard');
    await main(page).getByRole('link', { name: /Get Started/ }).click();
    await expect(page).toHaveURL('/onboard/new');
  });

  test('Connect navigates to /onboard/existing', async ({ page }) => {
    await page.goto('/onboard');
    await main(page).getByRole('link', { name: 'Connect' }).click();
    await expect(page).toHaveURL('/onboard/existing');
  });

  test('Open Dashboard navigates to /onboard/dashboard-only', async ({ page }) => {
    await page.goto('/onboard');
    await main(page).getByRole('link', { name: /Open Dashboard/ }).click();
    await expect(page).toHaveURL('/onboard/dashboard-only');
  });

  test('works at 375px mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/onboard');
    await expect(page.getByText('New ATP Project')).toBeVisible();
    await expect(page.getByText('Connect Existing Project')).toBeVisible();
    await expect(page.getByText('Explore the Dashboard')).toBeVisible();
  });
});

// ─── /onboard/new — new project wizard ────────────────────────────────────────

test.describe('/onboard/new wizard', () => {
  test('renders step 1 — environment check', async ({ page }) => {
    await page.goto('/onboard/new');
    await expect(page.getByText('Check your environment')).toBeVisible();
    await expect(page.getByText('Node.js ≥ 18')).toBeVisible();
    await expect(page.getByText('npm available')).toBeVisible();
    await expect(page.getByText('Port 3456 free')).toBeVisible();
  });

  test('preflight runs and enables Next button', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    const nextBtn = page.getByRole('button', { name: /Next/ });
    await expect(nextBtn).toBeEnabled();
  });

  test('step 2 — project name validates spaces/special chars', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText("What's your project called?")).toBeVisible();

    await page.getByPlaceholder('my-atp-agent').fill('my agent!');
    await expect(page.getByText('Only letters, numbers, hyphens')).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/ })).toBeDisabled();

    await page.getByPlaceholder('my-atp-agent').fill('my-agent');
    await expect(page.getByText('Only letters')).not.toBeVisible();
  });

  test('step 3 — language toggle cards visible', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder('my-atp-agent').fill('test-agent');
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Which language?')).toBeVisible();
    await expect(page.getByRole('button', { name: /TypeScript/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /JavaScript/ })).toBeVisible();
  });

  test('step 4 — security profile cards visible', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder('my-atp-agent').fill('test-agent');
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Choose your protection level')).toBeVisible();
    // Scope to buttons to avoid CLI panel text clash
    await expect(page.getByRole('button', { name: /Standard/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enhanced/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Maximum/ })).toBeVisible();
  });

  test('CLI panel updates live as options change', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder('my-atp-agent').fill('coolbot');
    await expect(page.getByText(/npx create-atp-agent coolbot/)).toBeVisible();
  });

  test('CLI panel has copy button', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder('my-atp-agent').fill('coolbot');
    await expect(page.getByLabel('Copy CLI command')).toBeVisible();
  });

  test('review screen shows Run Setup button', async ({ page }) => {
    await navigateNewWizardToReview(page);
    await expect(page.getByRole('button', { name: /Run Setup/ })).toBeVisible();
  });

  test('Run Setup shows execution log and success', async ({ page }) => {
    await navigateNewWizardToReview(page);
    await page.getByRole('button', { name: /Run Setup/ }).click();
    await expect(page.getByText('Setting up your project')).toBeVisible();
    await expect(page.getByText('Your agent is ready')).toBeVisible({ timeout: 20000 });
  });

  test('Back button on step 1 returns to /onboard', async ({ page }) => {
    await page.goto('/onboard/new');
    await page.getByRole('button', { name: /Back/ }).click();
    await expect(page).toHaveURL('/onboard');
  });

  test('progress bar advances', async ({ page }) => {
    await page.goto('/onboard/new');
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
  });

  test('works at 375px mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/onboard/new');
    await expect(page.getByText('Check your environment')).toBeVisible();
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible();
  });
});

// ─── /onboard/existing — existing project flow ────────────────────────────────

test.describe('/onboard/existing', () => {
  test('renders preflight check on step 1', async ({ page }) => {
    await page.goto('/onboard/existing');
    await expect(page.getByText('Check your environment')).toBeVisible();
    await expect(page.getByText('Node.js ≥ 18')).toBeVisible();
  });

  test('step 2 shows directory input and security profiles', async ({ page }) => {
    await page.goto('/onboard/existing');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await expect(page.getByText('Configure your project')).toBeVisible();
    await expect(page.getByPlaceholder(/my-agent/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Standard/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Enhanced/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Maximum/ })).toBeVisible();
  });

  test('step 2 Next disabled until directory filled', async ({ page }) => {
    await page.goto('/onboard/existing');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    const nextBtn = page.getByRole('button', { name: /Next/ });
    await expect(nextBtn).toBeDisabled();
    await page.getByPlaceholder(/my-agent/).fill('./my-project');
    await expect(nextBtn).toBeEnabled();
  });

  test('CLI panel shows npm install command', async ({ page }) => {
    await page.goto('/onboard/existing');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder(/my-agent/).fill('./my-project');
    await expect(page.getByText(/npm install atp-sdk/)).toBeVisible();
  });

  test('Run Setup shows execution log and success', async ({ page }) => {
    await page.goto('/onboard/existing');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByPlaceholder(/my-agent/).fill('./my-project');
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByRole('button', { name: /Run Setup/ }).click();
    await expect(page.getByText('Installing ATP')).toBeVisible();
    await expect(page.getByText('Your agent is ready')).toBeVisible({ timeout: 20000 });
  });

  test('Back on step 1 returns to /onboard', async ({ page }) => {
    await page.goto('/onboard/existing');
    await page.getByRole('button', { name: /Back/ }).click();
    await expect(page).toHaveURL('/onboard');
  });
});

// ─── /onboard/dashboard-only ──────────────────────────────────────────────────

test.describe('/onboard/dashboard-only', () => {
  test('renders preflight check', async ({ page }) => {
    await page.goto('/onboard/dashboard-only');
    await expect(page.getByText('Explore the Dashboard')).toBeVisible();
    await expect(page.getByText('Node.js ≥ 18')).toBeVisible();
  });

  test('Open Dashboard button disabled until checks pass', async ({ page }) => {
    await page.goto('/onboard/dashboard-only');
    const btn = page.getByRole('button', { name: /Open Local Dashboard/ });
    await expect(btn).toBeDisabled();
    await waitForPreflight(page);
    await expect(btn).toBeEnabled();
  });

  test('Open Dashboard button navigates to /dashboard', async ({ page }) => {
    await page.goto('/onboard/dashboard-only');
    await waitForPreflight(page);
    await page.getByRole('button', { name: /Open Local Dashboard/ }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('Back link returns to /onboard', async ({ page }) => {
    await page.goto('/onboard/dashboard-only');
    await page.getByText('Back to setup paths').click();
    await expect(page).toHaveURL('/onboard');
  });
});

// ─── /developers — Get Started section ───────────────────────────────────────

test.describe('/developers Get Started section', () => {
  test('shows three onboard CTA buttons above hero', async ({ page }) => {
    await page.goto('/developers');
    await expect(page.getByRole('link', { name: /New Project/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Connect Existing/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore Dashboard/ })).toBeVisible();
  });

  test('New Project → links to /onboard/new', async ({ page }) => {
    await page.goto('/developers');
    await page.getByRole('link', { name: /New Project/ }).click();
    await expect(page).toHaveURL('/onboard/new');
  });

  test('Connect Existing → links to /onboard/existing', async ({ page }) => {
    await page.goto('/developers');
    await page.getByRole('link', { name: /Connect Existing/ }).click();
    await expect(page).toHaveURL('/onboard/existing');
  });

  test('Explore Dashboard → links to /onboard/dashboard-only', async ({ page }) => {
    await page.goto('/developers');
    await page.getByRole('link', { name: /Explore Dashboard/ }).click();
    await expect(page).toHaveURL('/onboard/dashboard-only');
  });

  test('existing hero content still present below Get Started bar', async ({ page }) => {
    await page.goto('/developers');
    await expect(page.getByRole('heading', { name: /For Developers/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Quick Start/ }).first()).toBeVisible();
  });

  test('works at 375px mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/developers');
    await expect(page.getByRole('link', { name: /New Project/ })).toBeVisible();
  });
});

// ─── Preflight component ───────────────────────────────────────────────────────

test.describe('PreflightCheck component', () => {
  test('shows spinner then resolves all checks', async ({ page }) => {
    await page.goto('/onboard/new');
    // Spinner visible initially
    const spinner = page.locator('svg.animate-spin').first();
    await expect(spinner).toBeVisible();
    // Then resolves
    await waitForPreflight(page);
  });

  test('Technical details toggle shows raw output', async ({ page }) => {
    await page.goto('/onboard/new');
    await waitForPreflight(page);
    await page.getByText('Technical details').click();
    await expect(page.getByText(/node --version/)).toBeVisible();
    await expect(page.getByText(/npm --version/)).toBeVisible();
    await expect(page.getByText(/lsof -i :3456/)).toBeVisible();
  });
});

// ─── ExecutionLog component ────────────────────────────────────────────────────

test.describe('ExecutionLog component', () => {
  test('shows progress bar while running', async ({ page }) => {
    await navigateNewWizardToReview(page);
    await page.getByRole('button', { name: /Run Setup/ }).click();
    await expect(page.getByText('Running...')).toBeVisible();
    await expect(page.locator('.h-2.rounded-full.bg-muted')).toBeVisible();
  });

  test('expand advanced output toggle works', async ({ page }) => {
    await navigateNewWizardToReview(page);
    await page.getByRole('button', { name: /Run Setup/ }).click();
    await expect(page.getByText('Setting up your project')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your agent is ready')).toBeVisible({ timeout: 20000 });
    await page.getByText('Expand advanced output').click();
    await expect(page.getByText('Hide advanced output')).toBeVisible();
  });

  test('shows npm start and dashboard link on success', async ({ page }) => {
    await navigateNewWizardToReview(page);
    await page.getByRole('button', { name: /Run Setup/ }).click();
    await expect(page.getByText('Setting up your project')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Your agent is ready')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('npm start')).toBeVisible();
    await expect(page.getByRole('link', { name: 'http://localhost:3456' })).toBeVisible();
  });
});
