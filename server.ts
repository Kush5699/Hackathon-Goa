import express from 'express';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory store for shared images (since Cloud Run is stateless, 
// this works for the ephemeral preview)
interface StoredImage {
  id: string;
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}
const imageStore = new Map<string, StoredImage>();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Clean up old images every hour
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [id, img] of imageStore.entries()) {
    if (now - img.createdAt > maxAge) {
      imageStore.delete(id);
    }
  }
}, 60 * 60 * 1000);

app.post('/api/share', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const id = uuidv4();
    imageStore.set(id, {
      id,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      createdAt: Date.now()
    });

    res.json({ id });
  } catch (error) {
    console.error('Error sharing image:', error);
    res.status(500).json({ error: 'Failed to share image' });
  }
});

app.get('/api/image/:id', (req, res) => {
  const img = imageStore.get(req.params.id);
  if (!img) {
    return res.status(404).send('Image not found');
  }

  res.setHeader('Content-Type', img.mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
  res.send(img.buffer);
});

app.get('/s/:id', (req, res) => {
  const img = imageStore.get(req.params.id);
  if (!img) {
    return res.status(404).send('Not found');
  }

  const appUrl = process.env.APP_URL || `http://${req.headers.host}`;
  const imageUrl = `${appUrl}/api/image/${req.params.id}`;
  const title = "Hacker House Goa 2026";
  const description = "I'm building at Hacker House Goa 2026 \ud83c\udf34\ud83d\udcbb #FrameInGoa";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="${appUrl}/s/${req.params.id}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${imageUrl}">

      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${appUrl}/s/${req.params.id}">
      <meta property="twitter:title" content="${title}">
      <meta property="twitter:description" content="${description}">
      <meta property="twitter:image" content="${imageUrl}">
      
      <style>
        body {
          background-color: #105935;
          color: #f8f4e6;
          font-family: monospace;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
        }
        img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        h1 {
          margin-top: 24px;
          font-size: 1.5rem;
          color: #ffd900;
        }
      </style>
    </head>
    <body>
      <img src="${imageUrl}" alt="Builder ID">
      <h1>${title}</h1>
      <p>Redirecting to generator...</p>
      <script>
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
