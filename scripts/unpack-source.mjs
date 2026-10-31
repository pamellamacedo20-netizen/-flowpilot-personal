import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const payloadDir = path.join(root, '.source-payload');
if (!fs.existsSync(payloadDir)) process.exit(0);
const chunks = fs.readdirSync(payloadDir).filter((name) => name.startsWith('chunk-')).sort();
if (!chunks.length) process.exit(0);
const base64 = chunks.map((name) => fs.readFileSync(path.join(payloadDir, name), 'utf8')).join('');
const archive = path.join(root, '.pamella-academy-runtime.tar.gz');
fs.writeFileSync(archive, Buffer.from(base64, 'base64'));
execFileSync('tar', ['-xzf', archive, '-C', root], { stdio: 'inherit' });
fs.rmSync(archive, { force: true });
console.log(`Pamella Academy source materialized from ${chunks.length} payload chunks.`);
