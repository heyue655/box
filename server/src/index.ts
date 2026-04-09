import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import ssoRouter from './routes/sso';
import appsRouter from './routes/apps';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/sso', ssoRouter);
app.use('/api/apps', appsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static frontend in production
const clientDist = path.join(__dirname, '../../dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/sso') || req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[heyue-box] running on http://localhost:${PORT}`);
});
