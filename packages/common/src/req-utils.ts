import { Request } from 'express';
import { getClientIp } from 'request-ip';
import DeviceDetector from 'device-detector-js';

export function extractDeviceNameAndIp(req: Request) {
  let ip = getClientIp(req);

  const deviceDetector = new DeviceDetector();
  const deviceDetails = deviceDetector.parse(req.headers['user-agent']!);
  let deviceName!: string;

  if (deviceDetails.device)
    deviceName = deviceDetails.device.model
      ? deviceDetails.device.model
      : deviceDetails.device.brand
        ? `${deviceDetails.device.brand} ${deviceDetails.device.type}`
        : '';

  // fallbacks
  if (!deviceName && deviceDetails.os)
    deviceName = `${deviceDetails.os.platform} ${deviceDetails.os.name} ${deviceDetails.os.version}`;
  if (!deviceName && deviceDetails.client)
    deviceName = `${deviceDetails.client.name} ${deviceDetails.client.type} ${deviceDetails.client.version}`;

  deviceName = deviceName || 'Unknown';
  ip = ip || '127.0.0.1';

  return {
    ip,
    name: deviceName,
    isBot: !!deviceDetails.bot,
  };
}
