import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const payloadDir = path.join(root, '.source-payload');
const baseChunks = fs.readdirSync(payloadDir).filter((n) => n.startsWith('chunk-')).sort();
if (!baseChunks.length) throw new Error('Base V8 payload missing');
const base64 = baseChunks.map((n) => fs.readFileSync(path.join(payloadDir, n), 'utf8')).join('');
const baseArchive = path.join(root, '.pamella-base.tar.gz');
fs.writeFileSync(baseArchive, Buffer.from(base64, 'base64'));
execFileSync('tar', ['-xzf', baseArchive, '-C', root], { stdio: 'inherit' });
fs.rmSync(baseArchive, { force: true });

const overlayDir = path.join(root, '.v9-overlay');
if (fs.existsSync(overlayDir)) {
  const overlayChunks = fs.readdirSync(overlayDir).filter((n) => n.startsWith('chunk-')).sort();
  if (overlayChunks.length) {
    const overlay64 = overlayChunks.map((n) => fs.readFileSync(path.join(overlayDir, n), 'utf8')).join('');
    const overlayArchive = path.join(root, '.pamella-v9-overlay.tar.gz');
    fs.writeFileSync(overlayArchive, Buffer.from(overlay64, 'base64'));
    execFileSync('tar', ['-xzf', overlayArchive, '-C', root], { stdio: 'inherit' });
    fs.rmSync(overlayArchive, { force: true });
  }
}

console.log('Pamella Academy V9 materializada: base V8 + overlay V9.');
