// Serves OpenAPI spec and Swagger UI — mounted before helmet (Swagger needs inline assets).
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, '../../docs/openapi.yaml');

const router = Router();

router.get('/openapi.yaml', (_req, res) => {
  res.type('application/yaml').send(readFileSync(specPath, 'utf8'));
});

router.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    swaggerOptions: { url: '/api/openapi.yaml' },
    customSiteTitle: 'Blogging API',
  })
);

export default router;
