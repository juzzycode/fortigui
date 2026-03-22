const defaultPollingIntervalMs = 15 * 60 * 1000;

export const createHistoryService = ({ siteStore, fortiGateClient, alertService, historyStore, pollingIntervalMs = defaultPollingIntervalMs }) => {
  let intervalHandle = null;
  let warmupHandle = null;

  const collectSite = async (site) => {
    const summary = await fortiGateClient.summarizeSite(site);
    await historyStore.recordSiteMetric(summary);

    const alerts = await alertService.listAlerts({ siteId: site.id });
    await historyStore.recordAlerts(alerts);

    return { summary, alerts };
  };

  return {
    async collectNow(siteId) {
      if (siteId) {
        const site = await siteStore.getSiteById(siteId);
        if (!site) return null;
        return collectSite(site);
      }

      const sites = await siteStore.listSites();
      const results = await Promise.allSettled(sites.map((site) => collectSite(site)));
      return results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    },

    async getSiteHistory(siteId, { limit = 48, refresh = false } = {}) {
      if (refresh) {
        await this.collectNow(siteId).catch(() => null);
      }

      const [metrics, alerts] = await Promise.all([
        historyStore.listSiteMetrics(siteId, limit),
        historyStore.listAlertHistory({ siteId, limit: Math.max(limit, 24) }),
      ]);

      return {
        metrics: metrics
          .map((row) => ({
            siteId: row.site_id,
            observedAt: row.observed_at,
            status: row.status,
            wanStatus: row.wan_status,
            clientCount: Number(row.client_count ?? 0),
            switchCount: Number(row.switch_count ?? 0),
            apCount: Number(row.ap_count ?? 0),
            addressObjectCount: Number(row.address_object_count ?? 0),
            latencyAvgMs: row.latency_avg_ms === null ? null : Number(row.latency_avg_ms),
            latencyPacketLoss: row.latency_packet_loss === null ? null : Number(row.latency_packet_loss),
            apiReachable: Boolean(row.api_reachable),
            lastSyncError: row.last_sync_error || null,
          }))
          .reverse(),
        alerts: alerts.map((row) => ({
          id: row.id,
          siteId: row.site_id,
          deviceId: row.target_id || undefined,
          deviceType: row.target_type || undefined,
          severity: row.severity,
          type: row.type,
          title: row.title,
          description: row.description,
          timestamp: row.observed_at,
          acknowledged: false,
          source: 'live',
          context: row.context_json ? JSON.parse(row.context_json) : [],
        })),
      };
    },

    startScheduler() {
      if (intervalHandle) return;

      warmupHandle = setTimeout(() => {
        this.collectNow().catch((error) => {
          console.error('[history] Initial history collection failed:', error);
        });
      }, 3_000);

      intervalHandle = setInterval(() => {
        this.collectNow().catch((error) => {
          console.error('[history] Scheduled history collection failed:', error);
        });
      }, pollingIntervalMs);
    },
  };
};
