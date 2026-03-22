import express from 'express';

export const createSwitchesRouter = ({ siteStore, fortiGateClient }) => {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const requestedSiteId = typeof request.query.siteId === 'string' ? request.query.siteId : null;
    const sites = requestedSiteId
      ? [await siteStore.getSiteById(requestedSiteId)].filter(Boolean)
      : await siteStore.listSites();

    const switchLists = await Promise.all(
      sites.map(async (site) => ({
        siteId: site.id,
        switches: await fortiGateClient.listManagedSwitchesForSite(site).catch((error) => {
          console.error(`[switches] Failed to load switches for site ${site.id}:`, error);
          return [];
        }),
      })),
    );

    response.json({ switches: switchLists.flatMap((entry) => entry.switches) });
  });

  router.get('/:id', async (request, response) => {
    const sites = await siteStore.listSites();

    for (const site of sites) {
      const device = await fortiGateClient.getManagedSwitchDetailForSite(site, request.params.id).catch(() => null);
      if (device) {
        response.json({ switch: device });
        return;
      }
    }

    response.status(404).json({ error: 'Switch not found' });
  });

  return router;
};
