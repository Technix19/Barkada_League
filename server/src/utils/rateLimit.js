export function rateLimit({ windowMs, max }) {
  const clients = new Map();

  return function (req, res, next) {
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();

    const client = clients.get(ip);

    // First request from this IP
    if (!client) {
      clients.set(ip, {
        count: 1,
        windowStart: now,
      });

      return next();
    }

    // If the time window already ended, reset the counter
    if (now - client.windowStart >= windowMs) {
      clients.set(ip, {
        count: 1,
        windowStart: now,
      });

      return next();
    }

    // Too many requests
    if (client.count >= max) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    // Request is still allowed
    client.count++;

    next();
  };
}
