// src/server.js
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

import elementsRouter from './routes/elements.routes.js';
import statsRouter from './routes/stats.routes.js'; // ← nuevo

import swaggerUi from 'swagger-ui-express';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.ALLOWED_ORIGINS || '*')
        .split(',')
        .map((s) => s.trim());
      if (!origin || allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Origen no permitido por CORS: ' + origin));
    },
  })
);

// --- Rate limit simple en memoria ---
const WINDOW_MS = Number(process.env.RL_WINDOW_MS || 15 * 60 * 1000); // 15 min
const MAX_REQ = Number(process.env.RL_MAX_REQ || 300); // 300 req/ventana
const buckets = new Map(); // ip -> { start, count }

app.use((req, res, next) => {
  const ip =
    req.ip ||
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    'unknown';
  const now = Date.now();
  const b = buckets.get(ip) || { start: now, count: 0 };
  if (now - b.start > WINDOW_MS) {
    b.start = now;
    b.count = 0;
  }
  b.count += 1;
  buckets.set(ip, b);

  const remaining = Math.max(0, MAX_REQ - b.count);
  res.setHeader('X-RateLimit-Limit', String(MAX_REQ));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(b.start + WINDOW_MS));

  if (b.count > MAX_REQ) {
    const retryAfter = Math.ceil((b.start + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too Many Requests', retry_after_seconds: retryAfter });
  }

  next();
});
// --- fin rate limit ---

// OpenAPI docs
const openapiPath = path.join(__dirname, 'openapi.yaml');
const openapiDoc = fs.existsSync(openapiPath)
  ? YAML.parse(fs.readFileSync(openapiPath, 'utf8'))
  : null;
if (openapiDoc) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
}

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/v1/elements', elementsRouter);
app.use('/v1/stats', statsRouter); // ← nuevo

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Tabla Periódica escuchando en http://localhost:${PORT}`);
  if (openapiDoc) console.log(`Docs en http://localhost:${PORT}/docs`);
});
