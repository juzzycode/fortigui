import https from 'node:https';

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
  ...overrides,
});

export const createFortiGateClient = () => ({
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

    if (!site.fortigate_ip || !site.fortigate_api_key) {
      return normalizeSite(site, {
        status: 'warning',
        wanStatus: 'degraded',
        lastSyncError: 'FortiGate IP or API key is missing for this site.',
      });
    }

    try {
      const [statusPayload, addressPayload] = await Promise.all([
        requestJson(`https://${site.fortigate_ip}/api/v2/monitor/system/status`, site.fortigate_api_key),
        requestJson(`https://${site.fortigate_ip}/api/v2/cmdb/firewall/address?format=name`, site.fortigate_api_key),
      ]);

      const statusSource = statusPayload.results ?? statusPayload;
      const addressResults = Array.isArray(addressPayload.results) ? addressPayload.results : [];

      return normalizeSite(site, {
        status: 'healthy',
        wanStatus: 'online',
        fortigateName: statusSource.hostname || site.fortigate_name || site.name,
        fortigateVersion: statusSource.version || statusSource.firmware || null,
        fortigateSerial: statusSource.serial || statusSource.serial_number || null,
        addressObjectCount: addressResults.length,
        apiReachable: true,
      });
    } catch (error) {
      return normalizeSite(site, {
        status: 'offline',
        wanStatus: 'offline',
        lastSyncError: error instanceof Error ? error.message : 'Unable to reach FortiGate API',
      });
    }
  },
});
