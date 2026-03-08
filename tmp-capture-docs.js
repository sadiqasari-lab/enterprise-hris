const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = 'e:/DEV/Claud files/final project/tmp-screenshots';
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3005/auth/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'hr.admin@alnoor.com');
  await page.fill('#password', 'Hris2026!');
  await Promise.all([
    page.waitForURL((u) => u.toString().includes('/hr-admin'), { timeout: 20000 }),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);

  await page.goto('http://localhost:3005/hr-admin/documents', { waitUntil: 'networkidle' });
  const file = path.join(outDir, 'hr-admin-documents-live.png');
  await page.screenshot({ path: file, fullPage: true });

  await context.close();
  await browser.close();
  console.log(file);
})();
