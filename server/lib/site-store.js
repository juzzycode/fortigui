import crypto from 'node:crypto';

const nowIso = () => new Date().toISOString();
const makeId = (prefix) => `${prefix}_${crypto.randomUUID()}`;

const baseShorthand = (name) => {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return cleaned[0]?.slice(0, 3) || 'site';
};

export const createSiteStore = ({ db }) => ({
  async init() {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        shorthand_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        timezone TEXT NOT NULL,
        region TEXT NOT NULL,
        fortigate_name TEXT,
        fortigate_ip TEXT,
        fortigate_api_key TEXT,
        admin_username TEXT,
        admin_password TEXT,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  },

  async listSites() {
    return db.all(`SELECT * FROM sites ORDER BY is_demo ASC, name ASC`);
  },

  async getSiteById(id) {
    return (await db.get(`SELECT * FROM sites WHERE id = ?`, id)) ?? null;
  },

  async nextShorthandId(name) {
    const root = `site-${baseShorthand(name)}`;
    let candidate = root;
    let counter = 2;

    while (await db.get(`SELECT shorthand_id FROM sites WHERE shorthand_id = ?`, candidate)) {
      candidate = `${root}-${counter}`;
      counter += 1;
    }

    return candidate;
  },

  async createSite(input) {
    const shorthandId = await this.nextShorthandId(input.name);
    const row = {
      id: makeId('site'),
      shorthand_id: shorthandId,
      name: input.name,
      address: input.address,
      timezone: input.timezone,
      region: input.region,
      fortigate_name: input.fortigateName ?? '',
      fortigate_ip: input.fortigateIp ?? '',
      fortigate_api_key: input.fortigateApiKey ?? '',
      admin_username: input.adminUsername ?? '',
      admin_password: input.adminPassword ?? '',
      is_demo: input.isDemo ? 1 : 0,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    await db.run(
      `
        INSERT INTO sites (
          id, shorthand_id, name, address, timezone, region, fortigate_name, fortigate_ip,
          fortigate_api_key, admin_username, admin_password, is_demo, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      row.id,
      row.shorthand_id,
      row.name,
      row.address,
      row.timezone,
      row.region,
      row.fortigate_name,
      row.fortigate_ip,
      row.fortigate_api_key,
      row.admin_username,
      row.admin_password,
      row.is_demo,
      row.created_at,
      row.updated_at,
    );

    return this.getSiteById(row.id);
  },
});
