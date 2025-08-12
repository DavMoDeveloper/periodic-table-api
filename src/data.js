// src/data.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "elements.json");

// Lee el JSON
let raw;
try {
  raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (err) {
  throw new Error(`No se pudo leer o parsear ${dataPath}: ${err.message}`);
}

// Acepta array puro o { elements: [...] }
const arr = Array.isArray(raw)
  ? raw
  : Array.isArray(raw?.elements)
  ? raw.elements
  : [];
if (!Array.isArray(arr) || arr.length === 0) {
  throw new Error(
    `Contenido inválido en ${dataPath}. Regenera con "npm run build:data".`
  );
}

// Normaliza y ordena
const list = arr
  .map((e) => ({
    number: Number(e.number ?? e.atomicNumber),
    symbol: e.symbol,
    name: e.name,
    atomic_mass: e.atomic_mass ?? e.atomicMass ?? null,
    period: e.period ?? null,
    group: e.group ?? null,
    category: e.category ?? e.groupBlock ?? null,
    phase: e.phase ?? e.standardState ?? "unknown",
    block: e.block ?? null,
    summary: e.summary ?? null,
    electronic_configuration:
      e.electronic_configuration ?? e.electronicConfiguration ?? null,
    electronegativity_pauling:
      e.electronegativity_pauling ?? e.electronegativity ?? null,
    density: e.density ?? null,
    melt: e.melt ?? e.meltingPoint ?? null,
    boil: e.boil ?? e.boilingPoint ?? null,
  }))
  .filter(
    (e) =>
      Number.isFinite(e.number) &&
      typeof e.symbol === "string" &&
      typeof e.name === "string"
  )
  .sort((a, b) => a.number - b.number);

// Índices
const byNumber = new Map(list.map((e) => [e.number, e]));
const bySymbol = new Map(list.map((e) => [e.symbol.toLowerCase(), e]));

// ⬇️ Exportaciones con nombre (ESM)
export const elements = list;
export const indexBy = { number: byNumber, symbol: bySymbol };
