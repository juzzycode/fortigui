import crypto from 'node:crypto';

const nowIso = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

const hourBucket = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return nowIso().slice(0, 13);
  return date.toISOString().slice(0, 13);
};

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeLimit = (value, fallback = 50) => {
  const limit = Math.trunc(Number(value));
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : fallback;
};

export const createHistoryStore = ({ db }) => ({
  async init() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_metric_history (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        status TEXT NOT NULL,
        wan_status TEXT NOT NULL,
        client_count INTEGER NOT NULL DEFAULT 0,
        switch_count INTEGER NOT NULL DEFAULT 0,
        ap_count INTEGER NOT NULL DEFAULT 0,
        address_object_count INTEGER NOT NULL DEFAULT 0,
        latency_avg_ms REAL,
        latency_packet_loss REAL,
        api_reachable INTEGER NOT NULL DEFAULT 0,
        last_sync_error TEXT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_site_metric_history_site_observed
        ON site_metric_history(site_id, observed_at DESC);

      CREATE TABLE IF NOT EXISTS device_action_events (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        actor_username TEXT NOT NULL,
        payload_json TEXT,
        message TEXT,
        requested_at TEXT NOT NULL,
        completed_at TEXT,
        result_json TEXT,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_device_action_events_target
        ON device_action_events(target_id, requested_at DESC);

      CREATE TABLE IF NOT EXISTS alert_history (
        id TEXT PRIMARY KEY,
        fingerprint TEXT NOT NULL UNIQUE,
        site_id TEXT NOT NULL,
        target_id TEXT,
        target_type TEXT,
        severity TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        context_json TEXT,
        observed_at TEXT NOT NULL,
        observed_bucket TEXT NOT NULL,
        FOREIGN KEY(site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_alert_history_site_observed
        ON alert_history(site_id, observed_at DESC);
    `);
  },

  async recordSiteMetric(summary) {
    await db.run(
      `
        INSERT INTO site_metric_history (
          id, site_id, observed_at, status, wan_status, client_count, switch_count, ap_count,
          address_object_count, latency_avg_ms, latency_packet_loss, api_reachable, last_sync_error
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      makeId('metric'),
      summary.id,
      nowIso(),
      summary.status,
      summary.wanStatus,
      summary.clientCount ?? 0,
      summary.switchCount ?? 0,
      summary.apCount ?? 0,
      summary.addressObjectCount ?? 0,
      summary.latencyAvgMs ?? null,
      summary.latencyPacketLoss ?? null,
      summary.apiReachable ? 1 : 0,
      summary.lastSyncError ?? null,
    );
  },

  async listSiteMetrics(siteId, limit = 48) {
    const safeLimit = normalizeLimit(limit, 48);
    return db.all(
      `
        SELECT *
        FROM site_metric_history
        WHERE site_id = ?
        ORDER BY observed_at DESC
        LIMIT ?
      `,
      siteId,
      safeLimit,
    );
  },

  async createActionEvent({ siteId, targetId, targetType, action, actorUsername, payload }) {
    const id = makeId('action');
    const requestedAt = nowIso();

    await db.run(
      `
        INSERT INTO device_action_events (
          id, site_id, target_id, target_type, action, status, actor_username, payload_json, message, requested_at
        )
        VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?)
      `,
      id,
      siteId,
      targetId,
      targetType,
      action,
      actorUsername,
      payload ? JSON.stringify(payload) : null,
      'Action accepted and queued for execution.',
      requestedAt,
    );

    return this.getActionEventById(id);
  },

  async completeActionEvent(id, { status, message, result }) {
    await db.run(
      `
        UPDATE device_action_events
        SET status = ?, message = ?, completed_at = ?, result_json = ?
        WHERE id = ?
      `,
      status,
      message,
      nowIso(),
      result ? JSON.stringify(result) : null,
      id,
    );

    return this.getActionEventById(id);
  },

  async getActionEventById(id) {
    const row = await db.get(`SELECT * FROM device_action_events WHERE id = ?`, id);
    if (!row) return null;

    return {
      id: row.id,
      siteId: row.site_id,
      targetId: row.target_id,
      targetType: row.target_type,
      action: row.action,
      status: row.status,
      actorUsername: row.actor_username,
      payload: parseJson(row.payload_json, {}),
      message: row.message,
      requestedAt: row.requested_at,
      completedAt: row.completed_at || null,
      result: parseJson(row.result_json, null),
    };
  },

  async listRecentActions({ siteId, targetId, limit = 20 } = {}) {
    const safeLimit = normalizeLimit(limit, 20);
    if (targetId) {
      return db.all(
        `
          SELECT *
          FROM device_action_events
          WHERE target_id = ?
          ORDER BY requested_at DESC
          LIMIT ?
        `,
        targetId,
        safeLimit,
      );
    }

    if (siteId) {
      return db.all(
        `
          SELECT *
          FROM device_action_events
          WHERE site_id = ?
          ORDER BY requested_at DESC
          LIMIT ?
        `,
        siteId,
        safeLimit,
      );
    }

    return db.all(
      `
        SELECT *
        FROM device_action_events
        ORDER BY requested_at DESC
        LIMIT ?
      `,
      safeLimit,
    );
  },

  async recordAlerts(alerts) {
    for (const alert of alerts) {
      const observedAt = alert.timestamp || nowIso();
      const bucket = hourBucket(observedAt);
      const fingerprint = `${alert.id}:${bucket}`;

      await db.run(
        `
          INSERT OR IGNORE INTO alert_history (
            id, fingerprint, site_id, target_id, target_type, severity, type, title, description,
            context_json, observed_at, observed_bucket
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        makeId('alert'),
        fingerprint,
        alert.siteId,
        alert.deviceId ?? null,
        alert.deviceType ?? null,
        alert.severity,
        alert.type,
        alert.title,
        alert.description,
        alert.context ? JSON.stringify(alert.context) : null,
        observedAt,
        bucket,
      );
    }
  },

  async listAlertHistory({ siteId, targetId, limit = 50 } = {}) {
    const safeLimit = normalizeLimit(limit, 50);
    if (targetId) {
      return db.all(
        `
          SELECT *
          FROM alert_history
          WHERE target_id = ?
          ORDER BY observed_at DESC
          LIMIT ?
        `,
        targetId,
        safeLimit,
      );
    }

    if (siteId) {
      return db.all(
        `
          SELECT *
          FROM alert_history
          WHERE site_id = ?
          ORDER BY observed_at DESC
          LIMIT ?
        `,
        siteId,
        safeLimit,
      );
    }

    return db.all(
      `
        SELECT *
        FROM alert_history
        ORDER BY observed_at DESC
        LIMIT ?
      `,
      safeLimit,
    );
  },

  async listEventLogs({ targetId, siteId, limit = 25 }) {
    const [actions, alerts] = await Promise.all([
      this.listRecentActions({ targetId, siteId, limit }),
      this.listAlertHistory({ targetId, siteId, limit }),
    ]);

    const actionEvents = actions.map((row) => ({
      id: row.id,
      targetId: row.target_id,
      targetType: row.target_type,
      timestamp: row.completed_at || row.requested_at,
      actor: row.actor_username,
      message: `${row.action} ${row.status}${row.message ? `: ${row.message}` : ''}`,
      category: 'user',
    }));

    const alertEvents = alerts.map((row) => ({
      id: row.id,
      targetId: row.target_id || row.site_id,
      targetType: row.target_type || 'site',
      timestamp: row.observed_at,
      actor: 'EdgeOps monitor',
      message: row.title,
      category: 'alert',
    }));

    return [...actionEvents, ...alertEvents]
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
      .slice(0, limit);
  },
});
