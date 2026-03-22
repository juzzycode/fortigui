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

  async updateSwitchPortOverride({ switchId, portNumber, payload, actorUsername }) {
    const siteId = extractSiteIdFromTarget(switchId);
    if (!siteId) {
      throw new Error('Unable to resolve the site for this port update.');
    }

    const site = await siteStore.getSiteById(siteId);
    if (!site) {
      throw new Error('Site not found for this port update.');
    }

    const event = await historyStore.createActionEvent({
      siteId,
      targetId: switchId,
      targetType: 'switch',
      action: 'edit-port',
      actorUsername,
      payload: {
        port: portNumber,
        ...payload,
      },
    });

    try {
      const device = await fortiGateClient.getManagedSwitchDetailForSite(site, switchId);
      if (!device) {
        throw new Error('Switch not found in the live FortiGate inventory.');
      }

      const port = device.ports.find((candidate) => candidate.portNumber === portNumber);
      if (!port) {
        throw new Error('Port not found on the selected switch.');
      }

      const requestedVlan = typeof payload.vlan === 'string' ? payload.vlan.trim() : port.vlan;
      const requestedEnabled = typeof payload.enabled === 'boolean' ? payload.enabled : port.adminEnabled !== false;
      const requestedPoeEnabled = typeof payload.poeEnabled === 'boolean' ? payload.poeEnabled : port.poeEnabled !== false;
      let portSettingsResult = {
        changed: false,
        verified: true,
        current: {
          vlan: port.vlan,
          enabled: port.adminEnabled !== false,
          poeEnabled: port.poeEnabled !== false,
        },
      };

      if (
        requestedVlan !== port.vlan ||
        requestedEnabled !== (port.adminEnabled !== false) ||
        requestedPoeEnabled !== (port.poeEnabled !== false)
      ) {
        portSettingsResult = await fortiGateClient.updateManagedSwitchPortSettings(site, switchId, portNumber, {
          vlan: requestedVlan,
          enabled: requestedEnabled,
          poeEnabled: requestedPoeEnabled,
        });
      }

      const requestedDescription = typeof payload.description === 'string' ? payload.description.trim() : port.description;
      const liveDescription = (port.description || port.portNumber).trim();
      const descriptionOverride = requestedDescription && requestedDescription !== liveDescription ? requestedDescription : null;

      if (descriptionOverride) {
        await siteStore.upsertSwitchPortOverride({
          siteId,
          switchId,
          portNumber,
          description: descriptionOverride,
          vlan: null,
          enabled: null,
          updatedBy: actorUsername,
        });
      } else {
        await siteStore.deleteSwitchPortOverride(switchId, portNumber);
      }

      return historyStore.completeActionEvent(event.id, {
        status: portSettingsResult.changed && !portSettingsResult.verified ? 'manual_required' : 'completed',
        message: portSettingsResult.changed && !portSettingsResult.verified
          ? `FortiGate accepted the port update request, but the readback still shows VLAN ${portSettingsResult.current?.vlan ?? port.vlan}, status ${portSettingsResult.current?.enabled ? 'enabled' : 'disabled'}, and PoE ${portSettingsResult.current?.poeEnabled ? 'enabled' : 'disabled'} instead of the requested settings. EdgeOps kept the live FortiGate values to avoid drift.`
          : portSettingsResult.changed
          ? 'The port VLAN, administrative status, and PoE state were pushed to FortiGate successfully. Description remains EdgeOps-local until a stable controller description mutation path is finalized.'
          : 'Port description was saved in EdgeOps. The live FortiGate VLAN, status, and PoE settings did not require changes.',
        result: {
          portNumber,
          persistedIn: descriptionOverride
            ? portSettingsResult.changed && portSettingsResult.verified
              ? 'fortigate+edgeops'
              : 'edgeops'
            : portSettingsResult.changed && portSettingsResult.verified
              ? 'fortigate'
              : 'edgeops',
          current: portSettingsResult.current,
          requested: portSettingsResult.requested ?? {
            vlan: requestedVlan,
            enabled: requestedEnabled,
            poeEnabled: requestedPoeEnabled,
          },
        },
      });
    } catch (error) {
      return historyStore.completeActionEvent(event.id, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unable to save the port update.',
        result: null,
      });
    }
  },

  async resetSwitchPortOverride({ switchId, portNumber, actorUsername }) {
    const siteId = extractSiteIdFromTarget(switchId);
    if (!siteId) {
      throw new Error('Unable to resolve the site for this port reset.');
    }

    const event = await historyStore.createActionEvent({
      siteId,
      targetId: switchId,
      targetType: 'switch',
      action: 'reset-port-override',
      actorUsername,
      payload: {
        port: portNumber,
      },
    });

    try {
      await siteStore.deleteSwitchPortOverride(switchId, portNumber);
      return historyStore.completeActionEvent(event.id, {
        status: 'completed',
        message: 'EdgeOps local overrides for this port were cleared. Live FortiGate settings will be shown after refresh.',
        result: {
          portNumber,
          persistedIn: 'fortigate',
        },
      });
    } catch (error) {
      return historyStore.completeActionEvent(event.id, {
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unable to reset the port override.',
        result: null,
      });
    }
  },
});
