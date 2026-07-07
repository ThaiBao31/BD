import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHARED_FILE = path.join(__dirname, 'public/data/shared.json');

function sharedDataPlugin() {
  return {
    name: 'shared-data-api',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use('/api/shared', (req, res, next) => {
        if (req.url && req.url.includes('?')) {
          req.url = req.url.split('?')[0] ?? req.url;
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          try {
            if (!fs.existsSync(SHARED_FILE)) {
              fs.mkdirSync(path.dirname(SHARED_FILE), { recursive: true });
              fs.writeFileSync(
                SHARED_FILE,
                JSON.stringify(
                  {
                    version: 1,
                    updatedAt: new Date().toISOString(),
                    players: [],
                    matchSetup: {
                      teamA: {
                        formationId: '1-2-3-1',
                        assignments: [null, null, null, null, null, null, null],
                      },
                      teamB: {
                        formationId: '1-2-3-1',
                        assignments: [null, null, null, null, null, null, null],
                      },
                      updatedAt: new Date().toISOString(),
                    },
                  },
                  null,
                  2,
                ),
              );
            }
            const data = fs.readFileSync(SHARED_FILE, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch {
            next();
          }
          return;
        }

        if (req.method === 'PUT') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body) as Record<string, unknown>;
              const payload = {
                ...parsed,
                version: 1,
                updatedAt: new Date().toISOString(),
              };
              fs.mkdirSync(path.dirname(SHARED_FILE), { recursive: true });
              fs.writeFileSync(SHARED_FILE, JSON.stringify(payload, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Dữ liệu không hợp lệ' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sharedDataPlugin()],
});
