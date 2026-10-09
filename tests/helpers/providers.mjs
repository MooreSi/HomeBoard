import dns from 'node:dns/promises';
import {syncBuiltinESMExports} from 'node:module';
dns.lookup=async(host)=>{if(host==='feeds.bbci.co.uk')return [{address:'151.101.0.81',family:4}];if(host==='127.0.0.1')return [{address:'127.0.0.1',family:4}];throw Error('Unmocked DNS: '+host);};
syncBuiltinESMExports();
// Fake only external HTTP. Unknown external URLs fail closed; local sockets remain real.
import fs from 'node:fs/promises';
import path from 'node:path';
const realFetch=globalThis.fetch;
let msPages=0, googlePages=0;
globalThis.fetch=async(input,options={})=>{
 const u=new URL(input);if(['localhost','127.0.0.1'].includes(u.hostname))return realFetch(input,options);
 let control={};try{control=JSON.parse(await fs.readFile(path.join(process.env.DATA_DIR,'provider-control.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const logFile=path.join(process.env.DATA_DIR,'provider-requests.jsonl');await fs.appendFile(logFile,JSON.stringify({url:u.origin+u.pathname,params:Object.fromEntries(new URLSearchParams(options.body))})+'\n');
 if(control.failMicrosoft&&u.hostname==='graph.microsoft.com')return new Response(JSON.stringify({error:{code:'ServiceUnavailable'}}),{status:503});
 if(control.failWeather&&u.hostname==='api.openweathermap.org')return new Response('{}',{status:503});
 if(control.denyMicrosoft&&u.pathname.endsWith('/token'))return new Response(JSON.stringify({error:'authorization_declined'}),{status:400});
 const ok=value=>new Response(JSON.stringify(value),{status:200,headers:{'Content-Type':'application/json'}});
 if(u.hostname==='login.microsoftonline.com'){
  if(!u.pathname.startsWith('/common/'))throw Error('Microsoft must support work/school and personal accounts');
  if(u.pathname.endsWith('/devicecode')){const p=new URLSearchParams(options.body);if(!p.get('scope').includes('Calendars.ReadBasic'))throw Error('Missing read-only scope');return ok({device_code:'fake-device',user_code:'TEST-CODE',verification_uri:'https://microsoft.com/devicelogin',expires_in:600,interval:1});}
  return ok({access_token:'secret-ms-access',refresh_token:'secret-ms-refresh',expires_in:3600});
 }
 if(u.hostname==='oauth2.googleapis.com')return ok({access_token:'secret-google-access',refresh_token:'secret-google-refresh',expires_in:3600});
 if(u.hostname==='graph.microsoft.com'){
  if(options.headers.Authorization!=='Bearer secret-ms-access')throw Error('Missing Microsoft bearer token');
  if(u.pathname.endsWith('/calendars'))return ok({value:[{id:'work',name:'Work',isDefaultCalendar:true}]});
  msPages++;return ok(msPages%2?{value:[{id:'ms-event',subject:'Work meeting',start:{dateTime:'2026-10-09T08:00:00',timeZone:'UTC'},end:{dateTime:'2026-10-09T09:00:00',timeZone:'UTC'},sensitivity:'private'}],'@odata.nextLink':'https://graph.microsoft.com/v1.0/me/calendar/calendarView?page=2'}:{value:[{id:'ms-all-day',subject:'Holiday',isAllDay:true,start:{dateTime:'2026-10-10T00:00:00',timeZone:'UTC'},end:{dateTime:'2026-10-11T00:00:00',timeZone:'UTC'}}]});
 }
 if(u.hostname==='www.googleapis.com'){
  if(options.headers.Authorization!=='Bearer secret-google-access')throw Error('Missing Google bearer token');
  if(u.pathname.endsWith('/calendarList'))return ok({items:[{id:'primary',summary:'Family',primary:true}]});
  if(u.searchParams.get('singleEvents')!=='true')throw Error('Recurring events must be expanded');
  googlePages++;return ok(googlePages%2?{items:[{id:'g-event',summary:'Family lunch',start:{dateTime:'2026-10-09T12:00:00Z'},end:{dateTime:'2026-10-09T13:00:00Z'},visibility:'private'}],nextPageToken:'page-two'}:{items:[{id:'g-day',summary:'Birthday',start:{date:'2026-10-10'},end:{date:'2026-10-11'}}]});
 }
 if(u.hostname==='api.openweathermap.org'){
  if(u.searchParams.get('appid')!=='fake-weather-key')throw Error('Missing weather key');
  if(u.pathname.includes('/geo/'))return ok([{name:'London',country:'GB',lat:51.5,lon:-.1}]);
  return ok({timezone:'Europe/London',data:Array.from({length:7},(_,i)=>({dt:1791504000+i*86400,temp:{min:8+i,max:15+i},pop:.2,wind_speed:3,humidity:70,weather:[{id:800,description:'clear sky',icon:'01d'}]}))});
 }
 if(u.hostname==='feeds.bbci.co.uk')return new Response('<rss version="2.0"><channel><title>Test news</title><item><title><![CDATA[News & updates]]></title><link>https://example.com/story</link></item><item><title>Unsafe link</title><link>javascript:alert(1)</link></item></channel></rss>',{headers:{'Content-Type':'application/rss+xml'}});
 throw Error('Unmocked external request: '+u.origin+u.pathname);
};
