import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

function extractChunks(dirName, archiveName, expectedSha256 = null) {
  const dir = path.join(root, dirName);
  if (!fs.existsSync(dir)) return false;
  const chunks = fs.readdirSync(dir).filter((n) => n.startsWith('chunk-')).sort();
  if (!chunks.length) return false;
  const base64 = chunks.map((n) => fs.readFileSync(path.join(dir, n), 'utf8')).join('');
  const decoded = Buffer.from(base64, 'base64');
  if (expectedSha256) {
    const actual = crypto.createHash('sha256').update(decoded).digest('hex');
    if (actual !== expectedSha256) throw new Error(`${dirName} SHA-256 mismatch: ${actual}`);
  }
  const archive = path.join(root, archiveName);
  fs.writeFileSync(archive, decoded);
  execFileSync('tar', ['-xzf', archive, '-C', root], { stdio: 'inherit' });
  fs.rmSync(archive, { force: true });
  return true;
}

function copyOverlayContents(dirName) {
  const srcRoot = path.join(root, dirName);
  if (!fs.existsSync(srcRoot)) return;
  const walk = (src, rel = '') => {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const childRel = path.join(rel, entry.name);
      const from = path.join(src, entry.name);
      const to = path.join(root, childRel);
      if (entry.isDirectory()) {
        fs.mkdirSync(to, { recursive: true });
        walk(from, childRel);
      } else {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
      }
    }
  };
  walk(srcRoot);
}

if (!extractChunks('.source-payload', '.pamella-base.tar.gz')) throw new Error('Base V8 payload missing');
extractChunks('.v9-overlay', '.pamella-v9-overlay.tar.gz');
extractChunks('.v9-live-patch', '.pamella-v9-live-patch.tar.gz');
extractChunks('.v10-overlay', '.pamella-v10-overlay.tar.gz', '704f1bbc0d6e6edf8e5398e91202b8381fc8d5f93f760fb1bd9a84469222f3b6');
copyOverlayContents('.v10-security-overlay');

const dashboardPath = path.join(root, 'app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  let source = fs.readFileSync(dashboardPath, 'utf8');
  if (!source.includes("section==='mentoria'")) {
    const oldFilters = "const formations=catalog.filter(i=>i.section==='formacoes'),trails=catalog.filter(i=>i.section==='trilhas'),bonus=catalog.filter(i=>i.section==='bonus'),products=catalog.filter(i=>i.section==='produtos');";
    const newFilters = "const formations=catalog.filter(i=>i.section==='formacoes'),trails=catalog.filter(i=>i.section==='trilhas'),bonus=catalog.filter(i=>i.section==='bonus'),mentoring=catalog.filter(i=>i.section==='mentoria'),products=catalog.filter(i=>i.section==='produtos');";
    const oldRail = '<CatalogRail title="Bônus" items={bonus} onOpen={openCatalog}/><section className="editorial-banner banner-community">';
    const newRail = '<CatalogRail title="Bônus" items={bonus} onOpen={openCatalog}/>{mentoring.length>0&&<><section className="editorial-banner banner-trico"><div><span>MENTORIA PAMELLA ACADEMY</span><h2>Casos reais, estratégia e evolução profissional.</h2><p>Um espaço dedicado a discussão clínica e desenvolvimento com acompanhamento.</p></div></section><CatalogRail title="Mentoria" items={mentoring} onOpen={openCatalog}/></>}<section className="editorial-banner banner-community">';
    if (!source.includes(oldFilters) || !source.includes(oldRail)) throw new Error('Dashboard mentorship patch anchors not found');
    source = source.replace(oldFilters, newFilters).replace(oldRail, newRail);
    fs.writeFileSync(dashboardPath, source);
  }
}

console.log('Pamella Academy V10 materializada: V8 + V9 + live patch + V10 + security/equivalence overlay.');
