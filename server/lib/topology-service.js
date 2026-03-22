const summarizeTraffic = (ports) =>
  ports.reduce((sum, port) => sum + (port.stats?.rxBytes ?? 0) + (port.stats?.txBytes ?? 0), 0);

const buildNode = ({ id, type, label, status, siteId, meta = {}, x, y }) => ({
  id,
  type,
  label,
  status,
  siteId,
  meta,
  x,
  y,
});

export const createTopologyService = ({ siteStore, fortiGateClient }) => ({
  async getTopology({ siteId } = {}) {
    const sites = siteId ? [await siteStore.getSiteById(siteId)].filter(Boolean) : await siteStore.listSites();
    const siteResults = await Promise.all(
      sites.map(async (site, siteIndex) => {
        const [summary, switches, aps] = await Promise.all([
          fortiGateClient.summarizeSite(site).catch(() => null),
          fortiGateClient.listManagedSwitchesForSite(site).catch(() => []),
          fortiGateClient.listManagedAccessPointsForSite(site).catch(() => []),
        ]);

        const columnWidth = 340;
        const rowHeight = 140;
        const baseX = 60 + siteIndex * (columnWidth * 4);

        const nodes = [];
        const edges = [];
        const summaryNode = buildNode({
          id: site.id,
          type: 'site',
          label: site.name,
          status: summary?.status ?? 'warning',
          siteId: site.id,
          x: baseX,
          y: 50,
          meta: {
            fortigate: summary?.fortigateName || site.fortigate_name || site.name,
            latency: summary?.latencyAvgMs ?? null,
            clients: summary?.clientCount ?? 0,
          },
        });

        nodes.push(summaryNode);

        const switchNodes = switches.map((device, index) => {
          const node = buildNode({
            id: device.id,
            type: 'switch',
            label: device.hostname,
            status: device.status,
            siteId: device.siteId,
            x: baseX + columnWidth,
            y: 40 + index * rowHeight,
            meta: {
              model: device.model,
              ports: `${device.portsUsed}/${device.totalPorts}`,
              traffic: summarizeTraffic(device.ports),
              uplink: device.uplinkStatus,
            },
          });

          edges.push({
            id: `${site.id}-${device.id}`,
            from: summaryNode.id,
            to: device.id,
            status: device.uplinkStatus === 'down' ? 'critical' : device.uplinkStatus === 'degraded' ? 'warning' : 'healthy',
            label: device.uplinkStatus === 'up' ? 'FortiLink' : `Uplink ${device.uplinkStatus}`,
          });
          return node;
        });

        nodes.push(...switchNodes);

        const apNodes = aps.map((device, index) => {
          const fallbackSwitch = switchNodes[index % Math.max(switchNodes.length, 1)];
          const node = buildNode({
            id: device.id,
            type: 'ap',
            label: device.name,
            status: device.status,
            siteId: device.siteId,
            x: baseX + columnWidth * 2,
            y: 40 + index * rowHeight,
            meta: {
              model: device.model,
              clients: device.clients,
              radios: device.radios.length,
              ip: device.ip,
            },
          });

          edges.push({
            id: `${fallbackSwitch?.id || summaryNode.id}-${device.id}`,
            from: fallbackSwitch?.id || summaryNode.id,
            to: device.id,
            status: device.status,
            label: device.clients ? `${device.clients} clients` : 'Wireless edge',
          });
          return node;
        });

        nodes.push(...apNodes);

        const clientAggregateNode = buildNode({
          id: `${site.id}--clients`,
          type: 'client-group',
          label: 'Active Clients',
          status: summary?.clientCount ? 'healthy' : 'warning',
          siteId: site.id,
          x: baseX + columnWidth * 3,
          y: 50,
          meta: {
            clients: summary?.clientCount ?? 0,
            ssids: aps.reduce((sum, ap) => sum + ap.ssids.length, 0),
          },
        });

        nodes.push(clientAggregateNode);

        if (apNodes.length) {
          apNodes.forEach((node) => {
            edges.push({
              id: `${node.id}-${clientAggregateNode.id}`,
              from: node.id,
              to: clientAggregateNode.id,
              status: node.status,
              label: 'Associated clients',
            });
          });
        } else {
          edges.push({
            id: `${summaryNode.id}-${clientAggregateNode.id}`,
            from: summaryNode.id,
            to: clientAggregateNode.id,
            status: summary?.status ?? 'warning',
            label: 'Client estate',
          });
        }

        return {
          site: summary,
          nodes,
          edges,
        };
      }),
    );

    const nodes = siteResults.flatMap((entry) => entry.nodes);
    const edges = siteResults.flatMap((entry) => entry.edges);

    return {
      generatedAt: new Date().toISOString(),
      nodes,
      edges,
      summary: {
        siteCount: siteResults.length,
        switchCount: nodes.filter((node) => node.type === 'switch').length,
        apCount: nodes.filter((node) => node.type === 'ap').length,
        clientGroupCount: nodes.filter((node) => node.type === 'client-group').length,
      },
    };
  },
});
