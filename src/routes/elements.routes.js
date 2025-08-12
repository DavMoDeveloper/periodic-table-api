import { Router } from "express";
import { elements, indexBy } from "../data.js";
import { buildFilter } from "../utils/filters.js";
import { z } from "zod";

const router = Router();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const querySchema = z.object({
  q: z.string().trim().optional(),
  symbol: z.string().trim().optional(),
  number: z.coerce.number().int().positive().optional(),
  group: z.coerce.number().int().min(1).max(18).optional(),
  period: z.coerce.number().int().min(1).max(7).optional(),
  category: z.string().trim().optional(),
  state: z.enum(["solid", "liquid", "gas", "unknown"]).optional(),
  block: z.enum(["s", "p", "d", "f"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().default(20),
  sort: z.string().trim().optional(),
  fields: z.string().trim().optional(),
});

router.get("/", (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const q = parsed.data;

  let data = elements.filter(buildFilter(q));

  if (q.sort) {
    const keys = q.sort
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    data = data.slice().sort((a, b) => {
      for (const k of keys) {
        const desc = k.startsWith("-");
        const key = desc ? k.slice(1) : k;
        const va = a[key];
        const vb = b[key];
        if (va == null && vb == null) continue;
        if (va == null) return desc ? 1 : -1;
        if (vb == null) return desc ? -1 : 1;
        if (va < vb) return desc ? 1 : -1;
        if (va > vb) return desc ? -1 : 1;
      }
      return 0;
    });
  }

  const perPage = clamp(q.per_page, 1, 100);
  const page = clamp(q.page, 1, Math.ceil(data.length / perPage) || 1);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  let pageData = data.slice(start, end);

  if (q.fields) {
    const fields = new Set(
      q.fields
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    pageData = pageData.map((el) =>
      Object.fromEntries(Object.entries(el).filter(([k]) => fields.has(k)))
    );
  }

  res.json({
    count: data.length,
    page,
    per_page: perPage,
    total_pages: Math.ceil(data.length / perPage) || 1,
    data: pageData,
  });
});

router.get("/:id", (req, res) => {
  const id = String(req.params.id).toLowerCase();
  const el = indexBy.number.get(Number(id)) || indexBy.symbol.get(id);
  if (!el) return res.status(404).json({ error: "Elemento no encontrado" });
  res.json(el);
});

export default router;
