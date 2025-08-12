// src/app.js
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import elementsRouter from "./routes/elements.routes.js";
import { elements } from "./data.js";

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed =
        process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];
      if (!origin || allowed.includes(origin) || allowed.includes("*")) {
        return callback(null, true);
      }
      callback(new Error("CORS no permitido"));
    },
  })
);

// Rate limit (configurable por .env)
const limiter = rateLimit({
  windowMs: Number(process.env.RL_WINDOW_MS || 15 * 60 * 1000), // 15 min
  max: Number(process.env.RL_MAX_REQ || 100), // 100 req
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

// Rutas
app.use("/v1/elements", elementsRouter);

// Endpoint de estadísticas
app.get("/v1/stats", (req, res) => {
  const stats = {
    total: elements.length,
    byGroup: {},
    byPeriod: {},
    byCategory: {},
    byPhase: {},
  };
  elements.forEach((e) => {
    stats.byGroup[e.group] = (stats.byGroup[e.group] || 0) + 1;
    stats.byPeriod[e.period] = (stats.byPeriod[e.period] || 0) + 1;
    stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
    stats.byPhase[e.phase] = (stats.byPhase[e.phase] || 0) + 1;
  });
  res.json(stats);
});

export default app;
