// In-memory basic abuse guard. Not a distributed limiter; use Redis for scale.
export function rateLimit({ windowMs, max }) {
  const clients = new Map();
  let requests = 0;
  return function (req, res, next) {
    const now = Date.now();
    // Periodically remove expired IPs so the map does not grow indefinitely.
    if (++requests % 250 === 0) {
      for (const [ip, state] of clients) {
        if (now - state.windowStart >= windowMs) clients.delete(ip);
      }
    }
    const ip = req.ip || req.socket.remoteAddress;
    const client = clients.get(ip);
    if (!client || now - client.windowStart >= windowMs) {
      clients.set(ip, { count: 1, windowStart: now });
      return next();
    }
    if (client.count >= max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    client.count++;
    next();
  };
}
