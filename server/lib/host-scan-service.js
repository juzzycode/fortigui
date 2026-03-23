import { execFile } from 'node:child_process';
import { isIP } from 'node:net';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const parseOpenPorts = (output) =>
  String(output || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\/(tcp|udp)\s+/.test(line))
    .map((line) => {
      const parts = line.split(/\s+/);
      const [portToken, state = '', service = '', ...versionParts] = parts;
      const [port, protocol] = portToken.split('/');
      return {
        port: Number(port),
        protocol,
        state,
        service,
        version: versionParts.join(' ').trim(),
      };
    })
    .filter((entry) => Number.isFinite(entry.port));

const parseHostState = (output) => {
  const upMatch = String(output || '').match(/Host is ([^.]+)/i);
  if (upMatch) return upMatch[1].trim();
  if (/0 hosts up/i.test(String(output || ''))) return 'down';
  return 'unknown';
};

export const createHostScanService = () => ({
  async scanTarget(target) {
    if (!isIP(String(target || ''))) {
      throw new Error('A valid IP address is required for scanning.');
    }

    try {
      const { stdout, stderr } = await execFileAsync(
        'nmap',
        ['-Pn', '-n', '-sV', '--top-ports', '100', String(target)],
        { timeout: 45_000, windowsHide: true },
      );
      const rawOutput = [stdout, stderr].filter(Boolean).join('\n').trim();
      const openPorts = parseOpenPorts(rawOutput);
      const hostState = parseHostState(rawOutput);

      return {
        target: String(target),
        scannedAt: new Date().toISOString(),
        status: 'success',
        hostState,
        summary: openPorts.length
          ? `${openPorts.length} open port${openPorts.length === 1 ? '' : 's'} detected`
          : 'No open ports detected in the scanned top 100 ports',
        openPorts,
        rawOutput,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'nmap scan failed';
      return {
        target: String(target),
        scannedAt: new Date().toISOString(),
        status: 'failed',
        hostState: 'unknown',
        summary: 'Scan failed',
        openPorts: [],
        rawOutput: '',
        error: /ENOENT/i.test(message) ? 'nmap is not installed or not available on the server PATH.' : message,
      };
    }
  },
});
