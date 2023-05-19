import os from 'os'
export function getNetworkAddress(){
  const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    Object.keys(interfaces).forEach((nic) => {
        interfaces[nic]!.forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
                ips.push(details.address);
            }
        });
    });
    return ips?.[0] ? ips?.[0] : '127.0.0.1';
}
