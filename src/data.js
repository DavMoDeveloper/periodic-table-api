// src/data.js
// Lee y valida src/elements.json, garantizando que sea SIEMPRE un array de elementos.
// Construye índices por número atómico y símbolo con manejo seguro de duplicados.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, 'elements.json');

// --- Utilidades ---
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function isRecord(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function normalizeElement(e) {
  // Campos mínimos requeridos
  const number = toInt(e.number ?? e.atomicNumber);
  const symbol = typeof e.symbol === 'string' ? e.symbol.trim() : null;
  const name = typeof e.name === 'string' ? e.name.trim() : null;

  if (!number || !symbol || !name) return null;

  // Normalizaciones opcionales
  const period = toInt(e.period);
  const group = toInt(e.group);
  const atomic_mass = (() => {
    const s = (e.atomic_mass ?? e.atomicMass);
    if (s == null) return null;
    const cleaned = String(s).replace(/\s/g, '').replace(/\(.+\)/, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  })();

  return {
    number,
    symbol,
    name,
    atomic_mass,
    period,
    group,
    category: e.category ?? e.groupBlock ?? null,
    phase: e.phase ?? e.standardState ?? 'unknown',
    block: e.block ?? null,
    summary: e.summary ?? null,
    // Extras útiles (quedan disponibles aunque la API no los use directamente)
    electronic_configuration: e.electronic_configuration ?? e.electronicConfiguration ?? null,
    electronegativity_pauling: e.electronegativity_pauling ?? e.electronegativity ?? null,
    density: e.density ?? null,
    melt: e.melt ?? e.meltingPoint ?? null,
    boil: e.boil ?? e.boilingPoint ?? null
  };
}

function ensureArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.elements)) return payload.elements;
  throw new Error(
    'elements.json no es un array ni contiene la clave "elements". ' +
    'Ejecuta "npm run build:data" para regenerarlo.'
  );
}

// --- Carga y validación del dataset ---
let raw;
try {
  const text = fs.readFileSync(dataPath, 'utf8');
  raw = JSON.parse(text);
} catch (err) {
  throw new Error(`No se pudo leer o parsear ${dataPath}: ${err.message}`);
}

let list = ensureArrayPayload(raw)
  .map(normalizeElement)
  .filter(Boolean)
  .sort((a, b) => a.number - b.number);

// Validación mínima: esperamos al menos 100+ elementos
if (list.length < 100) {
  console.warn(
    `[WARN] Dataset con tamaño inesperado (${list.length}). ` +
    `Debería ser 118. Vuelve a generar con "npm run build:data".`
  );
}

// --- Construcción de índices (manejo de duplicados) ---
const byNumber = new Map();
const bySymbol = new Map();

for (const el of list) {
  if (!byNumber.has(el.number)) {
    byNumber.set(el.number, el);
  } else {
    console.warn(`[WARN] Número atómico duplicado: ${el.number} (se ignora el duplicado).`);
  }

  const key = el.symbol.toLowerCase();
  if (!bySymbol.has(key)) {
    bySymbol.set(key, el);
  } else {
    console.warn(`[WARN] Símbolo duplicado: ${el.symbol} (se ignora el duplicado).`);
  }
}

export const elements = list;
export const indexBy = {
  number: byNumber,
  symbol: bySymbol
};

console.log(`[INFO] Cargados ${elements.length} elementos desde ${path.relative(process.cwd(), dataPath)}.`);
