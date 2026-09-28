import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { subscribe } from '../utils/sseHub.js';

const router = Router();

// EventSource cannot set an Authorization header, so the token is passed as
// a query param here instead. It's verified the same way as the normal
// `protect` middleware before the stream is opened.
router.get('/stream', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).end();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 5000\n\n');
    res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    subscribe(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => clearInterval(keepAlive));
  } catch {
    res.status(401).end();
  }
});

export default router;
