import os from 'node:os';
import {isIPv4} from 'node:net';
import {pathToFileURL} from 'node:url';

export function formatLxcSummary(ctid, port, interfaces) {
 const addresses=[...new Set(Object.values(interfaces).flat()
  .filter(x=>x.family==='IPv4' && !x.internal && isIPv4(x.address) && !x.address.startsWith('127.') && !x.address.startsWith('169.254.'))
  .map(x=>x.address))];
 const heading=`\nHomeBoard installation complete (LXC ${ctid}).\n\n`;
 if(!addresses.length) return heading+`No dashboard IPv4 address detected. Check DHCP with:\n  pct exec ${ctid} -- ip -4 addr show\n\n`;
 return heading+'Open your dashboard:\n'+addresses.map(address=>`  http://${address}:${port}`).join('\n')+'\n\n';
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 const [ctid,port]=process.argv.slice(2);
 if(!/^[1-9][0-9]{2,8}$/.test(ctid||'') || !/^\d{1,5}$/.test(port||'') || Number(port)<1 || Number(port)>65535) {
  throw Error('Usage: node scripts/lxc-summary.mjs CONTAINER_ID PORT');
 }
 process.stdout.write(formatLxcSummary(ctid,port,os.networkInterfaces()));
}
