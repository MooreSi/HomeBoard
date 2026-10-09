import {Agent,fetch} from 'undici';
import {lookup} from 'node:dns/promises';
import {publicURL,isPublicAddress} from './http.mjs';
// Fetch and dispatcher come from the same package: Node's bundled version can
// use a different handler contract. DNS is checked again at socket connection.
const dispatcher=new Agent({connect:{lookup(hostname,options,callback){lookup(hostname,{all:true}).then(records=>{if(!records.length||records.some(x=>!isPublicAddress(x.address)))throw Error('Source must use a public internet address');if(options.all)callback(null,records);else callback(null,records[0].address,records[0].family);}).catch(callback);}}});
export async function publicRequest(value,{method='GET',body,headers={},maxBytes=2*1024*1024,allowedHost=()=>true}={}){
 const signal=AbortSignal.timeout(20000);let url=value;
 for(let count=0;count<5;count++){
  const u=await publicURL(url);if(!allowedHost(u))throw Error('Source returned an unsupported host');
  let r;try{r=await fetch(u,{method,body,dispatcher,signal,redirect:'manual',headers:{'User-Agent':'HomeBoard/0.3',...headers}});}catch(e){throw Error(e.name==='TimeoutError'?'Source timed out. Try again.':'Source connection failed'+(e.cause?.code?' ('+e.cause.code+')':'')+'. Check outbound network access.');}
  if([301,302,303,307,308].includes(r.status)){await r.body?.cancel();const location=r.headers.get('location');if(!location)throw Error('Source returned a redirect without a location');url=new URL(location,u).href;continue;}
  let size=0,chunks=[];try{for await(const chunk of r.body){size+=chunk.length;if(size>maxBytes)throw Error('Source exceeds the download size limit');chunks.push(chunk);}}catch(e){await r.body?.cancel().catch(()=>{});throw e;}
  return {status:r.status,headers:r.headers,body:Buffer.concat(chunks)};
 }
 throw Error('Source redirected too many times');
}
export async function publicText(value,options){const r=await publicRequest(value,options);if(r.status!==200)throw Error('Source request failed ('+r.status+')');return r.body.toString('utf8');}
