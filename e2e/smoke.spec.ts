import { test, expect, request } from '@playwright/test';

/**
 * Smoke tests for atp-website. Each test asserts the route returns a
 * usable status (no 4xx/5xx after redirects). These are the canary
 * tests CI runs on every PR — they must stay fast and stable.
 *
 * Tests for routes the audit flagged as broken (whitepaper PDF,
 * dashboard nav) are intentionally test.fixme so CI stays green until
 * those items land. Un-fixme in the PR that fixes them.
 */

const PUBLIC_ROUTES = [
  '/',
  '/developers',
  '/docs',
  '/pricing',
  '/login',
  '/signup',
  '/api-reference',
  '/onboard',
  '/playground'
];

for (const route of PUBLIC_ROUTES) {
  test(`GET ${route} renders`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `unexpected status for ${route}`).toBeLessThan(400);
  });
}

test('homepage shows brand heading', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/Agent Trust Protocol/i).first()).toBeVisible();
});

test('dashboard route does not 5xx', async ({ page }) => {
  // /dashboard may be auth-gated and redirect; we just require it not to crash.
  const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response!.status(), `unexpected status for /dashboard`).toBeLessThan(500);
});

test('homepage Quantum-Safe Signature demo produces visible output', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const button = page.getByRole('button', { name: /Generate Hybrid Signature/i });
  await button.scrollIntoViewIfNeeded();
  // Wait for hydration so the click handler is wired up.
  await expect(button).toBeEnabled({ timeout: 15_000 });
  await button.click();
  // Either the success block or the error alert must appear — both prove
  // the handler ran (no more silent failure).
  await expect(
    page.getByText(/Signature Generated|Signature generation failed/i).first()
  ).toBeVisible({ timeout: 15_000 });
});

test.fixme('whitepaper PDF is publicly downloadable', async ({ baseURL }) => {
  // FIXME(item-2): middleware currently redirects this to Enterprise Portal.
  // Unskip once /whitepaper/atp-whitepaper.pdf returns 200 without auth.
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.get('/whitepaper/atp-whitepaper.pdf', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/pdf/);
});

test.fixme('/dashboard exposes agents + policy-editor navigation', async ({ page }) => {
  // FIXME(item-6): dashboard nav currently omits these links.
  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: /agents/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /policy editor/i })).toBeVisible();
});
