import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { chromium } from 'playwright';

const rootDir = process.cwd();
const apiDir = path.join(rootDir, 'apps', 'api');
const webDir = path.join(rootDir, 'apps', 'web');
const reportPath = path.join(rootDir, 'testing', 'live-test-report.json');
const apiLogPath = path.join(rootDir, 'testing', 'api-dev.log');
const webLogPath = path.join(rootDir, 'testing', 'web-dev.log');

const API_BASE = 'http://localhost:3002';
const WEB_BASE = 'http://localhost:3001';

const credentials = {
  superAdmin: { email: 'admin@system.com', password: 'Admin123!', route: '/super-admin' },
  hrAdmin: { email: 'hr.admin@alnoor.com', password: 'Hris2026!', route: '/hr-admin' },
  hrOfficer: { email: 'hr.officer@alnoor.com', password: 'Hris2026!', route: '/hr-officer' },
  gm: { email: 'gm@alnoor.com', password: 'Hris2026!', route: '/gm' },
  manager: { email: 'manager.eng@alnoor.com', password: 'Hris2026!', route: '/manager' },
  employee: { email: 'employee@alnoor.com', password: 'Hris2026!', route: '/employee' },
};

function ensureCleanLog(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function startProcess(command, args, cwd, outputPath, env = {}) {
  const out = fs.createWriteStream(outputPath, { flags: 'a' });
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    env: { ...process.env, ...env },
  });

  proc.stdout.on('data', (data) => out.write(data));
  proc.stderr.on('data', (data) => out.write(data));

  return proc;
}

async function waitForUrl(url, timeoutMs = 120000) {
  const start = Date.now();
  let lastError = '';

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) {
        return true;
      }
      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timeout waiting for ${url}. Last error: ${lastError}`);
}

async function apiRequest({ method = 'GET', endpoint, token, body }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, json };
}

async function runApiSuite() {
  const tests = [];
  const add = (name, pass, detail = {}) => tests.push({ name, pass, ...detail });

  const health = await apiRequest({ endpoint: '/health' });
  add('Health check', health.ok, { status: health.status });

  const hrLogin = await apiRequest({
    method: 'POST',
    endpoint: '/api/auth/login',
    body: { email: credentials.hrAdmin.email, password: credentials.hrAdmin.password },
  });
  const hrToken = hrLogin.json?.data?.tokens?.accessToken;
  add('Auth login (HR Admin)', hrLogin.ok && !!hrToken, { status: hrLogin.status });

  if (!hrToken) {
    return tests;
  }

  const payrollSummary = await apiRequest({
    endpoint: '/api/payroll/reports/summary',
    token: hrToken,
  });
  add('Payroll summary endpoint', payrollSummary.ok && !!payrollSummary.json?.data?.summary, {
    status: payrollSummary.status,
  });

  const mobileLogin = await apiRequest({
    method: 'POST',
    endpoint: '/api/mobile/auth/login',
    body: { email: credentials.hrAdmin.email, password: credentials.hrAdmin.password, deviceInfo: 'playwright-suite' },
  });
  const mobileAccessToken = mobileLogin.json?.data?.tokens?.accessToken;
  const mobileRefreshToken = mobileLogin.json?.data?.tokens?.refreshToken;
  add('Mobile auth login', mobileLogin.ok && !!mobileAccessToken && !!mobileRefreshToken, {
    status: mobileLogin.status,
  });

  const mobileRefresh = await apiRequest({
    method: 'POST',
    endpoint: '/api/mobile/auth/refresh',
    body: { refreshToken: mobileRefreshToken },
  });
  add('Mobile auth refresh', mobileRefresh.ok && !!mobileRefresh.json?.data?.tokens?.accessToken, {
    status: mobileRefresh.status,
  });

  const mobileLogout = await apiRequest({
    method: 'POST',
    endpoint: '/api/mobile/auth/logout',
    token: mobileAccessToken,
  });
  add('Mobile auth logout', mobileLogout.ok, { status: mobileLogout.status });

  const employees = await apiRequest({
    endpoint: '/api/employees?limit=1',
    token: hrToken,
  });

  const employeeId = employees.json?.data?.employees?.[0]?.id;
  add('Employee listing', employees.ok && !!employeeId, { status: employees.status });

  const onboardingList = await apiRequest({
    endpoint: '/api/onboarding/checklists',
    token: hrToken,
  });
  add('Onboarding checklist list endpoint', onboardingList.ok, { status: onboardingList.status });

  if (!employeeId) {
    return tests;
  }

  const onboardingCreate = await apiRequest({
    method: 'POST',
    endpoint: '/api/onboarding/checklists',
    token: hrToken,
    body: { employeeId },
  });
  add(
    'Onboarding checklist create endpoint',
    onboardingCreate.status === 201 || onboardingCreate.status === 409,
    { status: onboardingCreate.status }
  );

  const onboardingEmployee = await apiRequest({
    endpoint: `/api/employees/${employeeId}/onboarding`,
    token: hrToken,
  });
  const taskId = onboardingEmployee.json?.data?.checklist?.tasks?.[0]?.id;
  add('Employee onboarding fetch endpoint', onboardingEmployee.ok && !!taskId, {
    status: onboardingEmployee.status,
  });

  if (taskId) {
    const onboardingUpdate = await apiRequest({
      method: 'PUT',
      endpoint: `/api/employees/${employeeId}/onboarding/tasks/${taskId}`,
      token: hrToken,
      body: { isCompleted: true },
    });
    add('Onboarding task update endpoint', onboardingUpdate.ok, { status: onboardingUpdate.status });
  } else {
    add('Onboarding task update endpoint', false, { status: 0, note: 'No onboarding task available' });
  }

  return tests;
}

async function loginAndCollectRoutes(browser, roleKey, info) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const routeChecks = [];
  const authNetwork = [];

  page.on('request', (req) => {
    if (req.url().includes('/auth/login')) {
      authNetwork.push({ phase: 'request', method: req.method(), url: req.url() });
    }
  });

  page.on('response', (res) => {
    if (res.url().includes('/auth/login')) {
      authNetwork.push({ phase: 'response', status: res.status(), url: res.url() });
    }
  });

  try {
    await page.goto(`${WEB_BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.fill('#email', info.email);
    await page.fill('#password', info.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(`**${info.route}**`, { timeout: 30000 });

    const links = await page.locator('aside nav a').evaluateAll((els) =>
      Array.from(new Set(els.map((el) => el.getAttribute('href')).filter(Boolean)))
    );

    const targets = [info.route, ...links.filter((href) => href && href.startsWith('/'))];
    const uniqueTargets = Array.from(new Set(targets));

    for (const href of uniqueTargets) {
      const response = await page.goto(`${WEB_BASE}${href}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const status = response ? response.status() : 0;
      const title = await page.title();
      const bodyText = await page.locator('body').innerText();
      const has404Text = /404|not found/i.test(bodyText);
      const pass = status >= 200 && status < 400 && !has404Text;
      routeChecks.push({ role: roleKey, route: href, status, pass, title });
    }

    return {
      role: roleKey,
      loginPass: true,
      finalUrl: page.url(),
      authNetwork,
      routeChecks,
    };
  } catch (error) {
    let uiError = '';
    const errorBox = page.locator('div.bg-red-50');
    if (await errorBox.count()) {
      uiError = (await errorBox.first().innerText()).trim();
    }

    return {
      role: roleKey,
      loginPass: false,
      error: error.message,
      uiError,
      authNetwork,
      routeChecks,
    };
  } finally {
    await context.close();
  }
}

async function runUiSuite() {
  const browser = await chromium.launch({ headless: true });
  const roleResults = [];

  try {
    for (const [role, info] of Object.entries(credentials)) {
      const result = await loginAndCollectRoutes(browser, role, info);
      roleResults.push(result);
    }
  } finally {
    await browser.close();
  }

  return roleResults;
}

function stopProcessTree(proc) {
  if (!proc || !proc.pid) return;
  spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
}

async function main() {
  ensureCleanLog(apiLogPath);
  ensureCleanLog(webLogPath);

  let apiProc;
  let webProc;
  const startedAt = new Date().toISOString();

  try {
    apiProc = startProcess('npm', ['run', 'dev'], apiDir, apiLogPath, { PORT: '3002' });
    webProc = startProcess('npm', ['run', 'dev', '--', '--port', '3001'], webDir, webLogPath, { PORT: '3001' });

    await waitForUrl(`${API_BASE}/health`);
    await waitForUrl(`${WEB_BASE}/auth/login`);

    const apiTests = await runApiSuite();
    const uiResults = await runUiSuite();

    const uiRouteChecks = uiResults.flatMap((r) => r.routeChecks || []);
    const apiPassed = apiTests.filter((t) => t.pass).length;
    const uiLoginsPassed = uiResults.filter((r) => r.loginPass).length;
    const uiRoutesPassed = uiRouteChecks.filter((r) => r.pass).length;

    const report = {
      startedAt,
      finishedAt: new Date().toISOString(),
      environment: {
        web: WEB_BASE,
        api: API_BASE,
      },
      summary: {
        api: { passed: apiPassed, total: apiTests.length },
        uiLogins: { passed: uiLoginsPassed, total: uiResults.length },
        uiRoutes: { passed: uiRoutesPassed, total: uiRouteChecks.length },
      },
      apiTests,
      uiRoleResults: uiResults,
      failedApiTests: apiTests.filter((t) => !t.pass),
      failedUiLogins: uiResults.filter((r) => !r.loginPass),
      failedUiRoutes: uiRouteChecks.filter((r) => !r.pass),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`Report written to: ${reportPath}`);
    console.log(`API tests: ${apiPassed}/${apiTests.length}`);
    console.log(`UI logins: ${uiLoginsPassed}/${uiResults.length}`);
    console.log(`UI routes: ${uiRoutesPassed}/${uiRouteChecks.length}`);

    if (report.failedApiTests.length > 0 || report.failedUiLogins.length > 0 || report.failedUiRoutes.length > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    const failureReport = {
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error.message,
    };
    fs.writeFileSync(reportPath, JSON.stringify(failureReport, null, 2));
    console.error(error);
    process.exitCode = 1;
  } finally {
    stopProcessTree(webProc);
    stopProcessTree(apiProc);
  }
}

main();
