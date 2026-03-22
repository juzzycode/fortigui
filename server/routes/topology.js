import express from 'express';
import { ensureSiteAccess, getScopedSiteId } from '../lib/auth.js';

export const createTopologyRouter = ({ topologyService }) => {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const siteId = getScopedSiteId(request) ?? undefined;
    if (siteId && !ensureSiteAccess(request, response, siteId)) {
      return;
    }

    const topology = await topologyService.getTopology({ siteId });
    response.json({ topology });
  });

  return router;
};
