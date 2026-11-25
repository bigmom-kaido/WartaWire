import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { getHealthPayload, queryRssNews } from './shared/rssAggregator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json(getHealthPayload());
  });

  app.get('/api/news', async (req: Request, res: Response) => {
    const result = await queryRssNews({
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      source: typeof req.query.source === 'string' ? req.query.source : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      refresh: typeof req.query.refresh === 'string' ? req.query.refresh : undefined,
    });
    res.status(result.status).json(result.body);
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'Endpoint tidak ditemukan' });
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output tidak ditemukan. Jalankan npm run build terlebih dahulu.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WartaWire RSS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
