import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)), data=process.env.DATA_DIR||path.join(root,'data');
await fs.mkdir(path.join(data,'photos'),{recursive:true});
const client=process.env.MICROSOFT_CLIENT_ID, authority='https://login.microsoftonline.com/consumers/oauth2/v2.0';
let flow, tokens=await read('tokens.json',null), cache=await read('calendar.json',{});
async function read(name,fallback){try{return JSON.parse(await fs.readFile(path.join(data,name),'utf8'))}catch{return fallback}}
async function save(name,value){await fs.writeFile(path.join(data,name),JSON.stringify(value),{mode:0o600})}
async function oauth(endpoint,body){const r=await fetch(authority+endpoint,{method:'POST',body:new URLSearchParams(body)});const j=await r.json();if(!r.ok){const e=new Error(j.error_description||j.error);e.code=j.error;throw e}return j}
async function storeTokens(t){tokens={...tokens,...t,expires:Date.now()+t.expires_in*1000};await save('tokens.json',tokens)}
async function access(){if(!tokens)throw Error('Connect Outlook in Settings first.');if(Date.now()>tokens.expires-60000)await storeTokens(await oauth('/token',{client_id:client,grant_type:'refresh_token',refresh_token:tokens.refresh_token}));return tokens.access_token}
async function body(req){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>12*1024*1024)throw Error('Maximum upload size is 12 MB');chunks.push(c)}return Buffer.concat(chunks)}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
const server=http.createServer(async(req,res)=>{try{
const u=new URL(req.url,'http://localhost');
if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Cross-origin request rejected'});
if(u.pathname==='/api/status')return json(res,200,{configured:!!client,connected:!!tokens});
if(u.pathname==='/api/connect'&&req.method==='POST'){if(!client)throw Error('Set MICROSOFT_CLIENT_ID in .env and restart Docker. See README.');flow=await oauth('/devicecode',{client_id:client,scope:'Calendars.ReadBasic offline_access'});flow.next=0;flow.until=Date.now()+flow.expires_in*1000;return json(res,200,{user_code:flow.user_code,verification_uri:flow.verification_uri,interval:flow.interval,expires_in:flow.expires_in})}
if(u.pathname==='/api/poll'&&req.method==='POST'){if(!flow||Date.now()>flow.until)throw Error('Sign-in expired. Start again.');if(Date.now()<flow.next)return json(res,200,{pending:true});flow.next=Date.now()+flow.interval*1000;try{await storeTokens(await oauth('/token',{client_id:client,grant_type:'urn:ietf:params:oauth:grant-type:device_code',device_code:flow.device_code}));flow=null;return json(res,200,{connected:true})}catch(e){if(e.code==='authorization_pending'||e.code==='slow_down'){if(e.code==='slow_down')flow.interval+=5;return json(res,200,{pending:true})}flow=null;throw e}}
if(u.pathname==='/api/disconnect'&&req.method==='POST'){tokens=null;cache={};flow=null;await fs.rm(path.join(data,'tokens.json'),{force:true});await fs.rm(path.join(data,'calendar.json'),{force:true});return json(res,200,{ok:true})}
if(u.pathname==='/api/events'){
const start=u.searchParams.get('start'),end=u.searchParams.get('end');if(!start||!end||isNaN(Date.parse(start))||isNaN(Date.parse(end)))throw Error('Invalid calendar range');const key=start+'|'+end;
if(!tokens)return json(res,200,{demo:true,events:[]});
try{let url='https://graph.microsoft.com/v1.0/me/calendar/calendarView?'+new URLSearchParams({startDateTime:start,endDateTime:end,'$top':'100','$select':'id,subject,start,end,isAllDay,sensitivity,location'});let events=[];const token=await access();while(url){if(new URL(url).origin!=='https://graph.microsoft.com')throw Error('Invalid pagination URL');const r=await fetch(url,{headers:{Authorization:'Bearer '+token,Prefer:'outlook.timezone="UTC"'}});if(!r.ok)throw Error('Outlook sync failed ('+r.status+'). Reconnect if needed.');const j=await r.json();events.push(...j.value);url=j['@odata.nextLink']}const result={events,updated:new Date().toISOString(),demo:false};cache[key]=result;await save('calendar.json',cache);return json(res,200,result)}catch(e){if(cache[key])return json(res,200,{...cache[key],stale:true,error:e.message});throw e}}
if(u.pathname==='/api/photos'&&req.method==='GET'){const files=await fs.readdir(path.join(data,'photos'));return json(res,200,files.filter(x=>x.endsWith('.jpg')).map(x=>'/photos/'+x))}
if(u.pathname==='/api/photos'&&req.method==='POST'){const b=await body(req);if(b[0]!==0xff||b[1]!==0xd8)throw Error('Upload a JPEG image');const name=crypto.randomUUID()+'.jpg';await fs.writeFile(path.join(data,'photos',name),b);return json(res,201,{url:'/photos/'+name})}
if(u.pathname==='/api/photos/delete'&&req.method==='POST'){const {url}=JSON.parse((await body(req)).toString());if(!/^\/photos\/[a-f0-9-]+\.jpg$/.test(url))throw Error('Invalid photo');await fs.rm(path.join(data,url.slice(1)),{force:true});return json(res,200,{ok:true})}
if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
const base=u.pathname.startsWith('/photos/')?data:path.join(root,'public');const file=path.resolve(base,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!file.startsWith(base+path.sep))return json(res,403,{error:'Forbidden'});const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'image/jpeg','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'"});res.end(b);
}catch(e){json(res,e.code==='ENOENT'?404:400,{error:e.message})}});
server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('Hearth listening on port '+(process.env.PORT||8080)));
