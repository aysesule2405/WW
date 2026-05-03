import express from 'express';
import path from 'path';
import cors from 'cors';
import routes from '../routes';
import { errorHandler } from '../core/middleware/error.middleware';

// Create and configure the Express app. The caller (server.ts) will start listening.
export default function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: true }));

  // Serve uploaded static assets (avatars) from backend/public
  app.use('/uploads', express.static(path.resolve(__dirname, '../../public/uploads')));

  // API routes
  app.use('/api', routes);

  // error handler
  app.use(errorHandler);

  app.get('/', (_req, res) => {
    res.send('game-backend: ok');
  });

  return app;
}
