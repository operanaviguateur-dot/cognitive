/**
 * Local development server for Cognitive Chronicle API
 * Simulates Vercel Functions locally using Express
 * Run with: npm run server (port 3001)
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Load .env.local if present
if (fs.existsSync(path.join(__dirname, '.env.local'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

/**
 * Dynamically load and mount API route handlers from /api directory
 * Maps file paths to Express routes:
 *   api/auth/login.js        -> POST /api/auth/login
 *   api/articles/index.js   -> GET|POST /api/articles
 *   api/articles/[id].js    -> GET|PUT|DELETE /api/articles/:id
 */
async function loadRoutes(dir, prefix = '/api') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadRoutes(fullPath, `${prefix}/${entry.name}`);
    } else if (entry.name.endsWith('.js')) {
      // Convert [id].js -> :id param
      let routeName = entry.name.replace(/\.js$/, '');
      let routePath;

      if (routeName === 'index') {
        routePath = prefix;
      } else {
        routeName = routeName.replace(/\[\.\.\.(\w+)\]/g, '*').replace(/\[(\w+)\]/g, ':$1');
        routePath = `${prefix}/${routeName}`;
      }

      try {
        const moduleUrl = pathToFileURL(fullPath).href;
        const mod = await import(moduleUrl);
        const handler = mod.default;

        if (typeof handler === 'function') {
          // Register for all HTTP methods — handler checks req.method internally
          app.all(routePath, (req, res) => {
            // Simulate Vercel's req/res interface
            handler(req, res);
          });

          // Simulate Vercel's vercel.json rewrites for our 3 main entities
          if (['articles', 'categories', 'comments'].includes(routeName)) {
            app.all(`${routePath}/:id`, (req, res) => {
              req.query = req.query || {};
              req.query.id = req.params.id;
              handler(req, res);
            });
            console.log(`  ✓ ${routePath}/:id (rewrite)`);
          }
          console.log(`  ✓ ${routePath}`);
        }
      } catch (err) {
        console.error(`  ✗ Failed to load ${fullPath}:`, err.message);
      }
    }
  }
}

const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
  console.log('\n📡 Loading API routes:');
  await loadRoutes(apiDir);
} else {
  console.warn('⚠️  No /api directory found. Create your Vercel Functions there.');
}

app.listen(PORT, () => {
  console.log(`\n🚀 API server running at http://localhost:${PORT}`);
  console.log('   Vite frontend should proxy /api/* to this server.');
  console.log('   Run "npm run dev" in another terminal for the frontend.\n');
});

