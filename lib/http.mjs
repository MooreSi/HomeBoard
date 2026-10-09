import {lookup} from 'node:dns/promises';
import net from 'node:net';
export async function jsonFetch(url,options={}){const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});let j;try{j=await r.json();}catch{throw Error('Provider returned an invalid response');}if(!r.ok){const e=Error('Provider request failed ('+r.status+'). Check credentials, permissions and subscription.');e.code=j.error?.code||j.error;e.status=r.status;throw e;}return j;}
export function isPublicAddress(ip){
 if(net.isIP(ip)===4){const [a,b]=ip.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19));}
 if(net.isIP(ip)===6){const s=ip.toLowerCase();return !s.startsWith('::')&&!s.startsWith('fc')&&!s.startsWith('fd')&&!s.startsWith('fe8')&&!s.startsWith('fe9')&&!s.startsWith('fea')&&!s.startsWith('feb')&&!s.startsWith('ff');}return false;
}
export async function publicURL(value){const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port))throw Error('Use a public HTTP(S) feed on port 80 or 443');const addresses=await lookup(u.hostname,{all:true});if(!addresses.length||addresses.some(x=>!isPublicAddress(x.address)))throw Error('News feed must use a public internet address');return u;}
