// scripts/build-elements.js
// Descarga y normaliza un dataset público a `src/elements.json` (118 elementos)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_URL = 'https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json';
const OUT_PATH = path.join(__dirname, '..', 'src', 'elements.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function cleanMass(mass) {
  if (mass == null) return null;
  const s = String(mass).replace(/\s/g, '').replace(/\(.+\)/, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function normalize(raw) {
  const list = raw.elements || raw.Elements || [];
  return list.map((e) => ({
    number: Number(e.number ?? e.atomicNumber),
    symbol: e.symbol,
    name: e.name,
    atomic_mass: cleanMass(e.atomic_mass ?? e.atomicMass),
    period: e.period ? Number(e.period) : null,
    group: e.group && e.group !== '' ? Number(e.group) : null,
    category: e.category ?? e.groupBlock ?? null,
    phase: e.phase ?? e.standardState ?? 'unknown',
    block: e.block ?? null,
    summary: e.summary ?? null,
    // Extras útiles para cursos
    electronic_configuration: e.electronic_configuration ?? e.electronicConfiguration ?? null,
    electronegativity_pauling: e.electronegativity_pauling ?? e.electronegativity ?? null,
    density: e.density ?? null,
    melt: e.melt ?? e.meltingPoint ?? null,
    boil: e.boil ?? e.boilingPoint ?? null
  })).sort((a, b) => a.number - b.number);
}

async function main() {
  console.log('Descargando dataset de la tabla periódica...');
  const src = await fetchJson(SRC_URL);
  const data = normalize(src);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + '\n');
  console.log(`Generado: ${OUT_PATH} (${data.length} elementos)`);
}

main().catch((err) => {
  console.error('Error al construir elements.json:', err.message);
  process.exitCode = 1;
});
