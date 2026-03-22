import express from 'express';

export const createProfilesRouter = ({ inventoryService }) => {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const siteId = typeof request.query.siteId === 'string' ? request.query.siteId : undefined;
    const profiles = await inventoryService.listProfiles({ siteId });
    response.json(profiles);
  });

  return router;
};
