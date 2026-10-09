import crypto from 'node:crypto';
import {publicRequest} from './public-http.mjs';
export function albumToken(value){const u=new URL(value);if(u.protocol!=='https:'||!['www.icloud.com','icloud.com'].includes(u.hostname)||u.port||u.username||u.password||u.search||!/^\/sharedalbum\/?$/.test(u.pathname)||!/^#[A-Za-z0-9]{12,24}$/.test(u.hash))throw Error('Use an iCloud public shared-album URL: https://www.icloud.com/sharedalbum/#album-id');return u.hash.slice(1);}
const streamHost=u=>u.protocol==='https:'&&/^p\d{2,4}-sharedstreams\.icloud\.com$/.test(u.hostname);
const imageHost=u=>u.protocol==='https:'&&/^[a-z0-9.-]+\.icloud-content\.com$/.test(u.hostname);
const base62='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function initialHost(token){const chars=token[0]==='A'?token.slice(1,2):token.slice(1,3),partition=[...chars].reduce((n,c)=>n*62+base62.indexOf(c),0);return `https://p${String(partition).padStart(2,'0')}-sharedstreams.icloud.com`;}
export class ICloudAlbum {
 constructor(secrets){this.secrets=secrets;this.files=new Map();this.updated=0;this.lastUrl='';this.status={connected:false,count:0};}
 async scan(force=false){const url=this.secrets().icloudAlbumUrl;if(!url){this.files.clear();this.status={connected:false,count:0,error:'Add a public shared-album URL'};return this.status;}if(!force&&url===this.lastUrl&&Date.now()-this.updated<300000)return this.status;
  if(url!==this.lastUrl){this.files.clear();this.updated=0;}this.lastUrl=url;
  try{const token=albumToken(url);let host=initialHost(token);const request=async(endpoint,body)=>publicRequest(host+'/'+token+'/sharedstreams/'+endpoint,{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'text/plain',Accept:'application/json'},allowedHost:streamHost,maxBytes:8*1024*1024});
   let r=await request('webstream',{streamCtag:null});if(r.status===330){const next=JSON.parse(r.body)['X-Apple-MMe-Host'];const candidate=new URL('https://'+next);if(!streamHost(candidate)||candidate.pathname!=='/')throw Error('Apple returned an unsupported album host');host=candidate.origin;r=await request('webstream',{streamCtag:null});}
   if(r.status!==200)throw Error('Apple album request failed ('+r.status+'). Enable Public Website in the shared album.');
   const stream=JSON.parse(r.body);if(!Array.isArray(stream.photos))throw Error('Apple returned an invalid album');if(stream.photos.length>2000)throw Error('Use an album with at most 2,000 photos');
   const photos=stream.photos.filter(p=>p.mediaAssetType!=='video'&&p.photoGuid&&p.derivatives),files=new Map();
   for(let i=0;i<photos.length;i+=25){const batch=photos.slice(i,i+25);r=await request('webasseturls',{photoGuids:batch.map(p=>p.photoGuid)});if(r.status!==200)throw Error('Apple photo URLs are unavailable ('+r.status+')');const assets=JSON.parse(r.body).items||{};
    for(const p of batch){const d=Object.values(p.derivatives).filter(d=>d.checksum&&assets[d.checksum]).sort((a,b)=>Number(b.width)*Number(b.height)-Number(a.width)*Number(a.height))[0];if(!d)continue;const a=assets[d.checksum],u=new URL('https://'+a.url_location+a.url_path);if(!imageHost(u)||u.username||u.password||u.port)throw Error('Apple returned an unsupported image host');files.set(crypto.createHash('sha256').update(token+p.photoGuid).digest('hex'),u.href);}
   }
   this.files=files;this.updated=Date.now();this.status={connected:true,count:files.size,name:typeof stream.streamName==='string'?stream.streamName:'Shared album'};
  }catch(e){this.status={connected:false,count:this.files.size,error:e.message,stale:this.files.size>0};}
  return this.status;
 }
 async list(){await this.scan();if(!this.status.connected&&!this.status.stale)throw Error(this.status.error);return [...this.files.keys()].map(id=>'/icloud-photos/'+id);}
 async read(id){await this.scan();const url=this.files.get(id);if(!url){const e=Error('Photo not found');e.code='ENOENT';throw e;}const r=await publicRequest(url,{allowedHost:imageHost,maxBytes:20*1024*1024});if(r.status!==200)throw Error('Apple image expired or is unavailable. Recheck the album in settings.');let type;if(r.body[0]===255&&r.body[1]===216)type='image/jpeg';else if(r.body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))type='image/png';else if(r.body.toString('ascii',0,4)==='RIFF'&&r.body.toString('ascii',8,12)==='WEBP')type='image/webp';else throw Error('Unsupported Apple photo format; use JPEG or PNG photos.');return {body:r.body,type};}
}
