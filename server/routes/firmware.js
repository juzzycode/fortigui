import express from 'express';

export const createFirmwareRouter = ({ inventoryService }) => {
  const router = express.Router();

  router.get('/', async (request, response) => {
    const siteId = typeof request.query.siteId === 'string' ? request.query.siteId : undefined;
    const firmware = await inventoryService.listFirmwareStatuses({ siteId });
    response.json({ firmware });
  });

  return router;
};
