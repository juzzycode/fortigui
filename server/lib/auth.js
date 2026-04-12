const sessionCookieName = 'edgeops_session';

const parseCookies = (cookieHeader = '') =>
  String(cookieHeader)
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');
      if (separatorIndex === -1) return cookies;
      const key = entry.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(entry.slice(separatorIndex + 1));
      cookies[key] = value;
      return cookies;
    }, {});

const shouldUseSecureCookie = (request) => {
  if (process.env.EDGEOPS_COOKIE_SECURE === 'true') return true;
  if (process.env.EDGEOPS_COOKIE_SECURE === 'false') return false;

  return request?.secure || request?.headers?.['x-forwarded-proto'] === 'https';
};

const cookieAttributes = ({ maxAgeSeconds, secure = false }) =>
  [
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : null,
    maxAgeSeconds !== undefined ? `Max-Age=${maxAgeSeconds}` : null,
  ]
    .filter(Boolean)
    .join('; ');

export const setSessionCookie = (response, token, maxAgeSeconds, request) => {
  response.setHeader(
    'Set-Cookie',
    `${sessionCookieName}=${encodeURIComponent(token)}; ${cookieAttributes({
      maxAgeSeconds,
      secure: shouldUseSecureCookie(request),
    })}`,
  );
};

export const clearSessionCookie = (response, request) => {
  response.setHeader('Set-Cookie', `${sessionCookieName}=; ${cookieAttributes({
    maxAgeSeconds: 0,
    secure: shouldUseSecureCookie(request),
  })}`);
};

export const createAuthMiddleware = ({ authStore }) => async (request, response, next) => {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!token) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const session = await authStore.getSessionByToken(token);
  if (!session) {
    clearSessionCookie(response, request);
    response.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  request.auth = {
    session,
    user: session.user,
    token,
  };

  await authStore.touchSession(token);
  next();
};

export const requireSuperAdmin = (request, response, next) => {
  if (request.auth?.user?.role !== 'super_admin') {
    response.status(403).json({ error: 'Super admin access required' });
    return;
  }

  next();
};

export const requireOperator = (request, response, next) => {
  if (request.auth?.user?.role === 'read_only') {
    response.status(403).json({ error: 'Read-only users cannot perform this action' });
    return;
  }

  next();
};

export const getScopedSiteId = (request) => {
  const requestedSiteId = typeof request.query.siteId === 'string' ? request.query.siteId : null;
  const assignedSiteId = request.auth?.user?.siteId ?? null;

  if (assignedSiteId) {
    return assignedSiteId;
  }

  return requestedSiteId;
};

export const ensureSiteAccess = (request, response, siteId) => {
  const assignedSiteId = request.auth?.user?.siteId ?? null;
  if (assignedSiteId && siteId !== assignedSiteId) {
    response.status(403).json({ error: 'This account is scoped to a different site' });
    return false;
  }

  return true;
};

export { sessionCookieName };
