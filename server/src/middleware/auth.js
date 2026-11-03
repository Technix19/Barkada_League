// Validate Supabase access tokens with the Auth service, not a decoded JWT.
// No service-role key is used. This avoids adding a dependency in Phase 1.
// Later, supabase-js getClaims can replace this network round-trip.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getBearerToken(authorization) {
  if (typeof authorization !== "string") return null;
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  return match?.[1] ?? null;
}

async function authenticate(req, res, next, required) {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    if (req.headers.authorization || required) {
      return res.status(401).json({ error: "Sign in required" });
    }
    req.user = null;
    return next();
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return res.status(503).json({ error: "Authentication is not configured" });
  }

  try {
    const response = await fetch(new URL("/auth/v1/user", url), {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: "Bearer " + token,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    if (!response.ok) {
      return res.status(503).json({ error: "Authentication service unavailable" });
    }
    const user = await response.json();
    if (typeof user.id !== "string" || !UUID_RE.test(user.id)) {
      return res.status(401).json({ error: "Invalid session" });
    }
    req.user = { id: user.id };
    return next();
  } catch (error) {
    console.error("Auth verification unavailable:", error.message);
    return res.status(503).json({ error: "Authentication service unavailable" });
  }
}

export function requireAuth(req, res, next) {
  return authenticate(req, res, next, true);
}

export function optionalAuth(req, res, next) {
  return authenticate(req, res, next, false);
}
