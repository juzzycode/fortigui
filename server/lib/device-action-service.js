const extractSiteIdFromTarget = (targetId) => {
  const [siteId] = String(targetId || '').split('--');
  return siteId || null;
};

const resolveTarget = async ({ targetType, targetId, site, fortiGateClient }) => {
  if (targetType === 'switch') {
    return fortiGateClient.getManagedSwitchDetailForSite(site, targetId);
  }

  if (targetType === 'ap') {
    return fortiGateClient.getManagedAccessPointDetailForSite(site, targetId);
  }

  if (targetType === 'site') {
    return fortiGateClient.summarizeSite(site);
  }

  return null;
};

const buildCompletion = ({ targetType, action, target }) => {
  if (!target) {
    return {
      status: 'failed',
      message: 'Target device could not be found in the live FortiGate inventory.',
      result: null,
    };
  }

  if (action === 'sync-config') {
    return {
      status: 'completed',
      message: 'Live inventory was refreshed successfully for this device.',
      result: {
        targetStatus: target.status,
      },
    };
  }

  return {
    status: 'manual_required',
    message:
      'The action was recorded, role-checked, and target-validated. A direct FortiGate REST mutation path for this command has not been finalized yet, so operator follow-up is still required.',
    result: {
      targetStatus: target.status,
      deviceName: target.hostname || target.name || target.id,
      action,
      targetType,
    },
  };
};

export const createDeviceActionService = ({ siteStore, fortiGateClient, historyStore }) => ({
  async execute({ targetType, targetId, action, payload, actorUsername }) {
    const siteId = extractSiteIdFromTarget(targetId);
    if (!siteId) {
      throw new Error('Unable to resolve the site for this device action.');
    }

    const site = await siteStore.getSiteById(siteId);
    if (!site) {
      throw new Error('Site not found for this device action.');
    }

    const event = await historyStore.createActionEvent({
      siteId,
      targetId,
      targetType,
      action,
      actorUsername,
      payload,
    });

    try {
      const target = await resolveTarget({ targetType, targetId, site, fortiGateClient });
      const completion = buildCompletion({ targetType, action, target });
      return historyStore.completeActionEvent(event.id, completion);
    } catch (error) {
      return historyStore.completeActionEvent(event.id, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unable to validate the requested target device.',
        result: null,
      });
    }
  },
});
