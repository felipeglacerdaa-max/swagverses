import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFile(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8');
}

test('admin pages use a root base tag for Vercel rewrites', () => {
  const adminHtml = readFile('admin.html');
  const adminLoginHtml = readFile('admin-login.html');

  assert.match(adminHtml, /<base\b[^>]*href=["']\/["'][^>]*>/i);
  assert.match(adminLoginHtml, /<base\b[^>]*href=["']\/["'][^>]*>/i);
});

test('admin redirects unauthenticated users to the login route', () => {
  const adminJs = readFile('admin.js');

  assert.match(adminJs, /getAdminLoginRoute\(\)/);
  assert.match(adminJs, /window\.location\.href = getAdminLoginRoute\(\)/);
});

test('admin login redirects authenticated users to the dashboard route', () => {
  const adminLoginHtml = readFile('admin-login.html');

  assert.match(adminLoginHtml, /getAdminDashboardRoute\(\)/);
  assert.match(adminLoginHtml, /window\.location\.href = getAdminDashboardRoute\(\)/);
});

test('vercel rewrites expose the admin login route', () => {
  const vercelConfig = readFile('vercel.json');

  assert.match(vercelConfig, /"source": "\/admin-login"/);
  assert.match(vercelConfig, /"source": "\/admin-login\/"/);
});

test('vite dev server serves admin routes locally', () => {
  const viteConfig = readFile('vite.config.js');

  assert.match(viteConfig, /configureServer/);
  assert.match(viteConfig, /req\.url === '\/admin' \|\| req\.url === '\/admin\/'/);
  assert.match(viteConfig, /req\.url === '\/admin\/painel' \|\| req\.url === '\/admin\/painel\/'/);
});
