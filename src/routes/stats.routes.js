// src/routes/stats.routes.js
import { Router } from 'express';
import { elements } from '../data.js';

const router = Router();

router.get('/', (_req, res) => {
  const countBy = (key) =>
    elements.reduce((acc, e) => {
      const k = e[key] ?? 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

  res.json({
    total: elements.length,
    byGroup: countBy('group'),
    byPeriod: countBy('period'),
    byCategory: countBy('category'),
    byPhase: countBy('phase')
  });
});

export default router;
