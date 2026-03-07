/* Lightweight perf/load smoke runner (Node 18+). No deps. */
const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3001/api'
const HEALTH_URL = process.env.PERF_HEALTH_URL || 'http://localhost:3001/health'
const EMAIL = process.env.PERF_EMAIL
const PASSWORD = process.env.PERF_PASSWORD
const CONCURRENCY = Number(process.env.PERF_CONCURRENCY || 1)
const ITERATIONS = Number(process.env.PERF_ITERATIONS || 3)
const TIMEOUT_MS = Number(process.env.PERF_TIMEOUT_MS || 8000)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout')), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

async function request(method, path, { token, body, baseUrl } = {}) {
  const url = baseUrl ? `${baseUrl}${path}` : `${BASE_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const start = process.hrtime.bigint()
  let ok = false
  let status = 0
  let error = null

  try {
    const res = await withTimeout(
      fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
      TIMEOUT_MS
    )
    status = res.status
    ok = res.ok
    if (!res.ok) {
      const text = await res.text()
      error = text || `HTTP ${res.status}`
    }
  } catch (err) {
    error = err?.message || 'Request failed'
  }

  const end = process.hrtime.bigint()
  const ms = Number(end - start) / 1e6
  return { ok, status, ms, error }
}

async function requestAbsolute(method, url) {
  const start = process.hrtime.bigint()
  let ok = false
  let status = 0
  let error = null

  try {
    const res = await withTimeout(fetch(url, { method }), TIMEOUT_MS)
    status = res.status
    ok = res.ok
    if (!res.ok) {
      const text = await res.text()
      error = text || `HTTP ${res.status}`
    }
  } catch (err) {
    error = err?.message || 'Request failed'
  }

  const end = process.hrtime.bigint()
  const ms = Number(end - start) / 1e6
  return { ok, status, ms, error }
}

async function login() {
  if (!EMAIL || !PASSWORD) {
    return { token: null, skipped: true }
  }
  const res = await request('POST', '/auth/login', {
    body: { email: EMAIL, password: PASSWORD },
  })
  if (!res.ok) return { token: null, skipped: false, error: res.error }

  // Re-run to parse token only once: lightweight extraction
  const authRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const data = await authRes.json()
  const token = data?.data?.tokens?.accessToken
  return { token, skipped: false, error: null }
}

async function runBatch(endpoints, token) {
  const results = []
  const queue = [...endpoints]

  async function worker() {
    while (queue.length) {
      const { method, path, auth } = queue.shift()
      let res
      if (path === '/health') {
        res = await requestAbsolute(method, HEALTH_URL)
      } else {
        res = await request(method, path, {
          token: auth ? token : undefined,
          baseUrl: BASE_URL,
        })
      }
      results.push({ method, path, ...res })
      await sleep(50)
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker())
  await Promise.all(workers)
  return results
}

function summarize(results, label) {
  const total = results.length
  const failed = results.filter((r) => !r.ok)
  const p95 = percentile(results.map((r) => r.ms), 0.95)
  const avg = results.reduce((s, r) => s + r.ms, 0) / Math.max(1, total)

  console.log(`\n${label}`)
  console.log(`Total: ${total}, Failed: ${failed.length}, Avg: ${avg.toFixed(1)}ms, P95: ${p95.toFixed(1)}ms`)
  if (failed.length) {
    failed.slice(0, 5).forEach((f) => {
      console.log(`  FAIL ${f.method} ${f.path} (${f.status || 'ERR'}): ${f.error}`)
    })
  }
}

function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.ceil(p * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

async function main() {
  console.log(`Perf smoke: ${BASE_URL}`)
  console.log(`Concurrency=${CONCURRENCY} Iterations=${ITERATIONS} Timeout=${TIMEOUT_MS}ms`)

  const auth = await login()
  if (auth.skipped) {
    console.log('No PERF_EMAIL/PERF_PASSWORD provided. Auth endpoints will be skipped.')
  } else if (!auth.token) {
    console.log(`Login failed: ${auth.error || 'unknown error'}`)
  }

  const unauthEndpoints = [
    { method: 'GET', path: '/health', auth: false },
  ]

  const authEndpoints = [
    { method: 'GET', path: '/auth/profile', auth: true },
    { method: 'GET', path: '/mobile/attendance/status', auth: true },
    { method: 'GET', path: '/mobile/attendance/history?page=1&limit=5', auth: true },
    { method: 'GET', path: '/mobile/leave/balances?year=2026', auth: true },
    { method: 'GET', path: '/mobile/leave/requests?page=1&limit=5', auth: true },
    { method: 'GET', path: '/mobile/payslips?year=2026', auth: true },
  ]

  const allResults = []
  for (let i = 0; i < ITERATIONS; i += 1) {
    const baseResults = await runBatch(unauthEndpoints, null)
    allResults.push(...baseResults)
    await sleep(300)

    if (auth.token) {
      const authResults = await runBatch(authEndpoints, auth.token)
      allResults.push(...authResults)
      await sleep(300)
    }
  }

  summarize(allResults.filter((r) => r.path === '/health'), 'Health endpoint')
  summarize(allResults.filter((r) => r.path !== '/health'), 'Auth + Mobile endpoints')
}

main().catch((err) => {
  console.error('Perf smoke failed:', err)
  process.exit(1)
})
