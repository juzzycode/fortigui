import express from 'express';
import { requireSuperAdmin } from '../lib/auth.js';

export const createSetupRouter = ({ setupStore }) => {
  const router = express.Router();

  router.use(requireSuperAdmin);

  router.get('/status', async (_request, response) => {
    response.json(await setupStore.getStatus());
  });

  router.post('/wizard', async (request, response) => {
    const { username, password, fortigateIp, fortigateApiKey } = request.body ?? {};

    if (!username || !password || !fortigateIp || !fortigateApiKey) {
      response.status(400).json({
        error: 'username, password, fortigateIp, and fortigateApiKey are required',
      });
      return;
    }

    const status = await setupStore.saveSetup({
      username,
      password,
      fortigateIp,
      fortigateApiKey,
    });

    response.status(201).json(status);
  });

  return router;
};
