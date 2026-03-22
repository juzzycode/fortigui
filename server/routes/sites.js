import express from 'express';

const demoSites = [
  { name: 'Austin HQ', address: '701 Congress Ave, Austin, TX', timezone: 'America/Chicago', region: 'Central' },
  { name: 'Denver Branch', address: '1801 California St, Denver, CO', timezone: 'America/Denver', region: 'Mountain' },
  { name: 'Raleigh Lab', address: '4242 Six Forks Rd, Raleigh, NC', timezone: 'America/New_York', region: 'East' },
  { name: 'Seattle Warehouse', address: '301 Elliott Ave W, Seattle, WA', timezone: 'America/Los_Angeles', region: 'West' },
];

export const createSitesRouter = ({ siteStore, fortiGateClient }) => {
  const router = express.Router();

  router.get('/', async (_request, response) => {
    const rows = await siteStore.listSites();
    const sites = await Promise.all(rows.map((site) => fortiGateClient.summarizeSite(site)));
    response.json({ sites });
  });

  router.post('/', async (request, response) => {
    const { name, address, timezone, region, fortigateName, fortigateIp, fortigateApiKey, adminUsername, adminPassword } = request.body ?? {};

    if (!name || !address || !timezone || !region) {
      response.status(400).json({ error: 'name, address, timezone, and region are required' });
      return;
    }

    const site = await siteStore.createSite({
      name,
      address,
      timezone,
      region,
      fortigateName,
      fortigateIp,
      fortigateApiKey,
      adminUsername,
      adminPassword,
      isDemo: false,
    });

    response.status(201).json({ site: await fortiGateClient.summarizeSite(site) });
  });

  router.post('/load-demo', async (_request, response) => {
    const existing = await siteStore.listSites();
    const existingNames = new Set(existing.map((site) => site.name));

    for (const demoSite of demoSites) {
      if (!existingNames.has(demoSite.name)) {
        await siteStore.createSite({
          name: demoSite.name,
          address: demoSite.address,
          timezone: demoSite.timezone,
          region: demoSite.region,
          fortigateName: `${demoSite.name} FortiGate`,
          isDemo: true,
        });
      }
    }

    const rows = await siteStore.listSites();
    const sites = await Promise.all(rows.map((site) => fortiGateClient.summarizeSite(site)));
    response.status(201).json({ sites });
  });

  router.get('/:id', async (request, response) => {
    const site = await siteStore.getSiteById(request.params.id);
    if (!site) {
      response.status(404).json({ error: 'Site not found' });
      return;
    }

    response.json({ site: await fortiGateClient.summarizeSite(site) });
  });

  return router;
};
