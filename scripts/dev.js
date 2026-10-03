// Runs the API (port 4000) and the web dev server (port 5173) together. Ctrl+C stops both.
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const apps = [
  { name: 'api', color: 36 },
  { name: 'web', color: 35 },
];

const children = apps.map(({ name, color }) => {
  const child = spawn(npm, ['run', 'dev', '-w', name], { shell: process.platform === 'win32' });
  const label = `\x1b[${color}m[${name}]\x1b[0m `;
  const pipe = (from, to) =>
    from.on('data', (chunk) => to.write(chunk.toString().replace(/^(?=.)/gm, label)));
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${label}stopped${code ? ` (exit ${code})` : ''}`);
    stopAll();
  });
  return child;
});

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill();
}
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
