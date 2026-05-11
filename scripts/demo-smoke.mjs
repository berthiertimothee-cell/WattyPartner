import { spawn } from 'node:child_process';

const port = Number(process.env.DEMO_PORT ?? 3100 + Math.floor(Math.random() * 500));
const baseUrl = process.env.DEMO_BASE_URL ?? `http://127.0.0.1:${port}`;
const timeoutMs = 45_000;

const checks = [
  { path: '/dashboard', type: 'html' },
  { path: '/sites', type: 'html' },
  { path: '/incidents', type: 'html' },
  { path: '/revenues', type: 'html' },
  { path: '/api/dashboard', type: 'json', assert: (b) => b.metrics && b.alerts && b.activity },
  { path: '/api/sites', type: 'json', assert: (b) => Array.isArray(b) && b.length > 0 },
  { path: '/api/incidents?openOnly=true', type: 'json', assert: (b) => Array.isArray(b) && b.every((i) => i.status !== 'RESOLVED') },
  { path: '/api/revenues?summary=true', type: 'json', assert: (b) => Array.isArray(b) && b.every((r) => Boolean(r.aiSummary?.body)) },
];

const server = spawn('npm', ['run', 'dev', '--', '-p', String(port)], {
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let ready = false;
const logs = [];
const onData = (chunk) => {
  const text = chunk.toString();
  logs.push(text);
  if (text.includes('Ready in') || text.includes('started server on')) ready = true;
};
server.stdout.on('data', onData);
server.stderr.on('data', onData);

const waitForReady = async () => {
  const start = Date.now();
  while (!ready && Date.now() - start < timeoutMs) await new Promise((r) => setTimeout(r, 300));
  if (!ready) throw new Error(`Dev server not ready after ${timeoutMs}ms.\n${logs.join('')}`);
};

const runChecks = async () => {
  for (const check of checks) {
    const res = await fetch(baseUrl + check.path);
    if (!res.ok) throw new Error(`${check.path} returned ${res.status}`);
    if (check.type === 'html') {
      const html = await res.text();
      if (!html.includes('<html')) throw new Error(`${check.path} did not return HTML`);
    } else {
      const payload = await res.json();
      const body = payload?.data ?? payload;
      if (check.assert && !check.assert(body)) throw new Error(`${check.path} assertion failed`);
    }
    console.log(`✓ ${check.path}`);
  }
};

try {
  await waitForReady();
  await runChecks();
  console.log('\nSmoke demo flow passed.');
} catch (error) {
  console.error('\nSmoke demo flow failed:\n', error);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
