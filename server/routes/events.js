import express from 'express';

export const createEventsRouter = ({ historyStore }) => {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const targetId = typeof request.query.targetId === 'string' ? request.query.targetId : undefined;
    const siteId = typeof request.query.siteId === 'string' ? request.query.siteId : request.auth?.user?.siteId ?? undefined;
    const scopedSiteId = request.auth?.user?.siteId ?? null;
    const limit = Number(request.query.limit);

    if (scopedSiteId) {
      const requestedTargetSiteId = targetId ? targetId.split('--')[0] : siteId;
      if (requestedTargetSiteId && requestedTargetSiteId !== scopedSiteId) {
        response.status(403).json({ error: 'This account is scoped to a different site' });
        return;
      }
    }

    const events = await historyStore.listEventLogs({
      targetId,
      siteId,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    });

    response.json({ events });
  });

  return router;
};
