import { execFile } from 'node:child_process';
import https from 'node:https';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const pingCacheTtlMs = 60_000;

const requestJson = (url, apiKey) =>
  new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        rejectUnauthorized: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          if ((response.statusCode ?? 500) >= 400) {
            reject(new Error(`FortiGate request failed with HTTP ${response.statusCode}`));
            return;
          }

          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    request.on('error', reject);
    request.end();
  });

const parseMaybeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const extractStatusField = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
};

const extractFromStatusPayload = (payload, keys) =>
  extractStatusField(payload?.results ?? {}, keys) || extractStatusField(payload, keys);

const parseUnixPing = (stdout) => {
  const packetLossMatch = stdout.match(/(\d+(?:\.\d+)?)%\s+packet loss/i);
  const roundTripMatch = stdout.match(/=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/[\d.]+/);
  if (!packetLossMatch) return null;

  return {
    minMs: parseMaybeNumber(roundTripMatch?.[1]),
    avgMs: parseMaybeNumber(roundTripMatch?.[2]),
    maxMs: parseMaybeNumber(roundTripMatch?.[3]),
    packetLoss: parseMaybeNumber(packetLossMatch[1]),
  };
};

const parseWindowsPing = (stdout) => {
  const packetLossMatch = stdout.match(/\((\d+)%\s+loss\)/i);
  const minMatch = stdout.match(/Minimum = (\d+)ms/i);
  const maxMatch = stdout.match(/Maximum = (\d+)ms/i);
  const avgMatch = stdout.match(/Average = (\d+)ms/i);
  if (!packetLossMatch) return null;

  return {
    minMs: parseMaybeNumber(minMatch?.[1]),
    avgMs: parseMaybeNumber(avgMatch?.[1]),
    maxMs: parseMaybeNumber(maxMatch?.[1]),
    packetLoss: parseMaybeNumber(packetLossMatch[1]),
  };
};

const parsePingOutput = (stdout) => parseUnixPing(stdout) ?? parseWindowsPing(stdout);

const shouldRefreshLatency = (site) => {
  if (!site.latency_checked_at) return true;

  const checkedAt = new Date(site.latency_checked_at).getTime();
  if (!Number.isFinite(checkedAt)) return true;

  return Date.now() - checkedAt > pingCacheTtlMs;
};

const runPing = async (host) => {
  const args =
    process.platform === 'win32'
      ? ['-n', '3', '-w', '2000', host]
      : ['-n', '-c', '3', '-W', '2', host];

  try {
    const { stdout, stderr } = await execFileAsync('ping', args, { timeout: 10_000 });
    const parsed = parsePingOutput(stdout);

    if (!parsed) {
      return {
        avgMs: null,
        minMs: null,
        maxMs: null,
        packetLoss: null,
        checkedAt: new Date().toISOString(),
        error: stderr?.trim() || 'Ping output could not be parsed.',
      };
    }

    return {
      ...parsed,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string' && error.stderr.trim()
        ? error.stderr.trim()
        : error instanceof Error
          ? error.message
          : 'Ping failed';

    return {
      avgMs: null,
      minMs: null,
      maxMs: null,
      packetLoss: null,
      checkedAt: new Date().toISOString(),
      error: message,
    };
  }
};

const toLatencySummary = (site) => ({
  avgMs: parseMaybeNumber(site.latency_avg_ms),
  minMs: parseMaybeNumber(site.latency_min_ms),
  maxMs: parseMaybeNumber(site.latency_max_ms),
  packetLoss: parseMaybeNumber(site.latency_packet_loss),
  checkedAt: site.latency_checked_at || null,
  error: site.latency_error || null,
});

const normalizeSite = (site, overrides = {}) => ({
  id: site.id,
  shorthandId: site.shorthand_id,
  name: site.name,
  address: site.address,
  timezone: site.timezone,
  region: site.region,
  status: 'warning',
  wanStatus: 'degraded',
  clientCount: 0,
  switchCount: 0,
  apCount: 0,
  fortigateName: site.fortigate_name || site.name,
  fortigateIp: site.fortigate_ip || '',
  source: site.is_demo ? 'demo' : 'live',
  fortigateVersion: null,
  fortigateSerial: null,
  addressObjectCount: 0,
  apiReachable: false,
  lastSyncError: null,
  latencyAvgMs: parseMaybeNumber(site.latency_avg_ms),
  latencyMinMs: parseMaybeNumber(site.latency_min_ms),
  latencyMaxMs: parseMaybeNumber(site.latency_max_ms),
  latencyPacketLoss: parseMaybeNumber(site.latency_packet_loss),
  latencyCheckedAt: site.latency_checked_at || null,
  latencyError: site.latency_error || null,
  ...overrides,
});

export const createFortiGateClient = ({ siteStore }) => ({
  async summarizeSite(site) {
    if (site.is_demo) {
      return normalizeSite(site, {
        status: 'healthy',
        wanStatus: 'online',
        clientCount: 97,
        switchCount: 4,
        apCount: 6,
        apiReachable: false,
      });
    }

    let workingSite = site;
    if (site.fortigate_ip && shouldRefreshLatency(site)) {
      workingSite = await siteStore.updateLatencyCache(site.id, await runPing(site.fortigate_ip));
    }

    const latency = toLatencySummary(workingSite);

    if (!workingSite.fortigate_ip || !workingSite.fortigate_api_key) {
      return normalizeSite(workingSite, {
        status: 'warning',
        wanStatus: 'degraded',
        lastSyncError: 'FortiGate IP or API key is missing for this site.',
      });
    }

    try {
      const [statusPayload, addressPayload] = await Promise.all([
        requestJson(`https://${workingSite.fortigate_ip}/api/v2/monitor/system/status`, workingSite.fortigate_api_key),
        requestJson(`https://${workingSite.fortigate_ip}/api/v2/cmdb/firewall/address?format=name`, workingSite.fortigate_api_key),
      ]);

      const addressResults = Array.isArray(addressPayload.results) ? addressPayload.results : [];
      const fortigateVersion = extractFromStatusPayload(statusPayload, ['version', 'firmware', 'build', 'major']);
      const fortigateSerial = extractFromStatusPayload(statusPayload, ['serial', 'serial_number', 'serial-no', 'sn']);
      const fortigateName = extractFromStatusPayload(statusPayload, ['hostname', 'name']);
      const hasIdentity = Boolean(fortigateVersion && fortigateSerial);

      return normalizeSite(workingSite, {
        status: hasIdentity ? 'healthy' : 'warning',
        wanStatus: latency.packetLoss === 100 ? 'offline' : latency.packetLoss && latency.packetLoss > 0 ? 'degraded' : 'online',
        fortigateName: fortigateName || workingSite.fortigate_name || workingSite.name,
        fortigateVersion,
        fortigateSerial,
        addressObjectCount: addressResults.length,
        apiReachable: true,
        latencyAvgMs: latency.avgMs,
        latencyMinMs: latency.minMs,
        latencyMaxMs: latency.maxMs,
        latencyPacketLoss: latency.packetLoss,
        latencyCheckedAt: latency.checkedAt,
        latencyError: latency.error,
        lastSyncError: hasIdentity ? null : 'FortiGate API authenticated, but firmware or serial fields were not returned by monitor/system/status.',
      });
    } catch (error) {
      return normalizeSite(workingSite, {
        status: latency.packetLoss === 100 ? 'offline' : 'warning',
        wanStatus: latency.packetLoss === 100 ? 'offline' : 'degraded',
        latencyAvgMs: latency.avgMs,
        latencyMinMs: latency.minMs,
        latencyMaxMs: latency.maxMs,
        latencyPacketLoss: latency.packetLoss,
        latencyCheckedAt: latency.checkedAt,
        latencyError: latency.error,
        lastSyncError: error instanceof Error ? error.message : 'Unable to reach FortiGate API',
      });
    }
  },
});
