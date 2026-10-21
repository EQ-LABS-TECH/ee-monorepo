import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tmp = join(root, '.tmp', 'playwright');
mkdirSync(tmp, { recursive: true });

const env = {
  ...process.env,
  TEMP: tmp,
  TMP: tmp,
  TMPDIR: tmp,
};

const r = spawnSync(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'playwright', 'test', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    cwd: root,
    env,
    shell: process.platform === 'win32',
  },
);

process.exit(r.status ?? 1);
