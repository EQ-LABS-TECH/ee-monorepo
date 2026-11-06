import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = [
  ['package.json', 'Root package.json'],
  ['pnpm-workspace.yaml', 'Workspace config'],
  ['turbo.json', 'Turbo config'],
  ['.npmrc', 'npm config'],
  ['.nvmrc', 'Node version'],
  ['.editorconfig', 'Editor config'],
  ['.gitignore', 'Git ignore'],
  ['.gitattributes', 'Git attributes'],
  ['LICENSE', 'License'],
  ['NOTICE', 'Notice'],
  ['README.md', 'Readme'],
  ['CHANGELOG.md', 'Changelog'],
];

const DIRECTORIES = [
  ['apps', 'Applications'],
  ['packages', 'Packages'],
  ['connectors/official', 'Official Connectors'],
  ['connectors/community', 'Community Connectors'],
  ['connectors/experimental', 'Experimental Connectors'],
  ['scripts', 'Scripts'],
  ['.github', 'GitHub config'],
  ['.vscode', 'VSCode config'],
];

export function runDoctor({
  root = process.cwd(),
  platform = process.platform,
  architecture = process.arch,
  spawnSyncImpl = spawnSync,
  exists = existsSync,
  readFile = readFileSync,
  output = console,
} = {}) {
  let hasErrors = false;

  function check(command, args, label) {
    output.log(`  Checking ${label}...`);

    const result = spawnSyncImpl(command, args, {
      stdio: 'inherit',
      shell: platform === 'win32',
      cwd: root,
    });

    if (result.status !== 0) {
      hasErrors = true;
      output.log(`  ✗ ${label}: failed`);
      return false;
    }

    output.log(`  ✓ ${label}: passed`);
    return true;
  }

  function checkPath(path, label) {
    if (exists(join(root, path))) {
      output.log(`  ✓ ${label}: present`);
      return true;
    }

    output.log(`  ✗ ${label}: missing`);
    hasErrors = true;
    return false;
  }

  output.log('🩺 Engineering Ecosystem Environment Diagnostic');
  output.log('===============================================');
  output.log('');
  output.log('System:');
  check('node', ['--version'], 'Node.js');
  check('pnpm', ['--version'], 'pnpm');
  check('git', ['--version'], 'Git');

  output.log('');
  output.log('Project Structure:');
  for (const [path, label] of FILES) checkPath(path, label);

  output.log('');
  output.log('Directory Structure:');
  for (const [path, label] of DIRECTORIES) checkPath(path, label);

  output.log('');
  output.log('Key Dependencies:');
  try {
    const pkg = JSON.parse(readFile(join(root, 'package.json'), 'utf-8'));
    output.log(`  ✓ Turbo: ${pkg.devDependencies?.turbo || 'not found'}`);
    output.log(`  ✓ Node: ${pkg.engines?.node || 'not specified'}`);
    output.log(`  ✓ pnpm: ${pkg.packageManager || 'not specified'}`);
  } catch {
    output.log('  ✗ Could not read package.json');
    hasErrors = true;
  }

  output.log('');
  output.log('Environment Summary:');
  output.log(`  Root: ${root}`);
  output.log(`  Platform: ${platform}`);
  output.log(`  Architecture: ${architecture}`);
  output.log('');

  if (hasErrors) {
    output.error('❌ Diagnostic completed with errors.');
    return { status: 'FAIL', exitCode: 1 };
  }

  output.log('✅ Diagnostic completed successfully.');
  return { status: 'PASS', exitCode: 0 };
}
