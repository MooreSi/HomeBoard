import {forecastIntervals} from './weather-fixture.mjs';
import dns from 'node:dns/promises';
import {syncBuiltinESMExports} from 'node:module';
dns.lookup=async(host)=>{if(['feeds.bbci.co.uk','outlook.live.com','p00-sharedstreams.icloud.com','cvws.icloud-content.com'].includes(host))return [{address:'151.101.0.81',family:4}];if(host==='127.0.0.1')return [{address:'127.0.0.1',family:4}];throw Error('Unmocked DNS: '+host);};
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
 if(control.wrongAudience&&u.pathname.endsWith('/token'))return new Response(JSON.stringify({error:'unauthorized_client',error_description:'AADSTS50020: User account does not exist in tenant'}),{status:400});
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
  if(control.cancelMicrosoft&&!u.searchParams.get('$select')?.split(',').includes('isCancelled'))throw Error('Missing Microsoft cancellation flag selection');
  msPages++;return ok(msPages%2?{value:[{id:'ms-event',subject:'Work meeting',start:{dateTime:'2026-10-09T08:00:00',timeZone:'UTC'},end:{dateTime:'2026-10-09T09:00:00',timeZone:'UTC'},sensitivity:'private',isCancelled:!!control.cancelMicrosoft}],'@odata.nextLink':u.origin+u.pathname+'?'+new URLSearchParams({page:'2','$select':u.searchParams.get('$select')||''})}:{value:[{id:'ms-all-day',subject:'Holiday',isAllDay:true,start:{dateTime:'2026-10-10T00:00:00',timeZone:'UTC'},end:{dateTime:'2026-10-11T00:00:00',timeZone:'UTC'}}]});
 }
 if(u.hostname==='www.googleapis.com'){
  if(options.headers.Authorization!=='Bearer secret-google-access')throw Error('Missing Google bearer token');
  if(u.pathname.endsWith('/calendarList'))return ok({items:[{id:'primary',summary:'Family',primary:true}]});
  if(u.searchParams.get('singleEvents')!=='true')throw Error('Recurring events must be expanded');
  googlePages++;return ok(googlePages%2?{items:[{id:'g-event',summary:'Family lunch',start:{dateTime:'2026-10-09T12:00:00Z'},end:{dateTime:'2026-10-09T13:00:00Z'},visibility:'private'}],nextPageToken:'page-two'}:{items:[{id:'g-day',summary:'Birthday',start:{date:'2026-10-10'},end:{date:'2026-10-11'}}]});
 }
 if(u.hostname==='api.openweathermap.org'){
  if(u.searchParams.get('appid')!=='fake-weather-key')throw Error('Missing weather key');
  if(u.pathname.includes('/geo/1.0/zip'))return ok({name:'London',country:'GB',lat:51.5,lon:-.1});
  if(control.denyOneCall&&u.pathname.includes('4.0'))return new Response(JSON.stringify({message:'One Call subscription required'}),{status:401});
  if(u.pathname.includes('/data/2.5/forecast'))return ok({city:{timezone:3600},list:forecastIntervals()});
  if(u.pathname.includes('/geo/'))return ok([{name:'London',country:'GB',lat:51.5,lon:-.1}]);
  return ok({timezone:'Europe/London',data:Array.from({length:7},(_,i)=>({dt:1791504000+i*86400,temp:{min:8+i,max:15+i},pop:.2,wind_speed:3,humidity:70,weather:[{id:800,description:'clear sky',icon:'01d'}]}))});
 }
 if(u.hostname==='feeds.bbci.co.uk')return new Response('<rss version="2.0"><channel><title>Test news</title><item><title><![CDATA[News & updates]]></title><link>https://example.com/story</link></item><item><title>Unsafe link</title><link>javascript:alert(1)</link></item></channel></rss>',{headers:{'Content-Type':'application/rss+xml'}});
 throw Error('Unmocked external request: '+u.origin+u.pathname);
};

// Public source HTTP is mocked at the socket-dispatcher boundary, so the real
// installed fetch implementation, handler contract and parsers run in tests.
import {Agent,MockAgent} from 'undici';
const mockTransport=new Agent();mockTransport.dispatch=mockTransport.dispatch.bind(mockTransport);
const publicMock=new MockAgent({agent:mockTransport});publicMock.disableNetConnect();
publicMock.get('https://feeds.bbci.co.uk').intercept({path:'/news/rss.xml'}).reply(200,'<rss version="2.0"><channel><title>Test news</title><item><title><![CDATA[News & updates]]></title><link>https://example.com/story</link></item><item><title>Unsafe link</title><link>javascript:alert(1)</link></item></channel></rss>').persist();
const ics=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','UID:walk','DTSTAMP:20261001T000000Z','DTSTART:20261009T080000Z','DTEND:20261009T090000Z','RRULE:FREQ=DAILY;COUNT=2','SUMMARY:Family walk','END:VEVENT','BEGIN:VEVENT','UID:day','DTSTAMP:20261001T000000Z','DTSTART;VALUE=DATE:20261011','DTEND;VALUE=DATE:20261012','SUMMARY:Birthday','END:VEVENT','END:VCALENDAR'].join('\r\n');
publicMock.get('https://outlook.live.com').intercept({path:'/owa/calendar/test/calendar.ics'}).reply(200,ics).persist();
publicMock.get('https://p00-sharedstreams.icloud.com').intercept({path:'/B00000000000000/sharedstreams/webstream',method:'POST',body:JSON.stringify({streamCtag:null})}).reply(200,{streamName:'Test album',photos:[{photoGuid:'photo-one',derivatives:{large:{checksum:'image-one',width:'1000',height:'800'}}}]}).persist();
publicMock.get('https://p00-sharedstreams.icloud.com').intercept({path:'/B00000000000000/sharedstreams/webasseturls',method:'POST',body:JSON.stringify({photoGuids:['photo-one']})}).reply(200,{items:{'image-one':{url_location:'cvws.icloud-content.com',url_path:'/test.jpg'}}}).persist();
publicMock.get('https://cvws.icloud-content.com').intercept({path:'/test.jpg'}).reply(200,Buffer.from([255,216,255,217]),{headers:{'content-type':'image/jpeg'}}).persist();
Agent.prototype.dispatch=function(options,handler){if(options.body?.[Symbol.asyncIterator]){(async()=>{const chunks=[];for await(const chunk of options.body)chunks.push(Buffer.from(chunk));return publicMock.dispatch({...options,body:Buffer.concat(chunks).toString()},handler);})().catch(e=>handler.onResponseError(null,e));return true;}return publicMock.dispatch(options,handler);};
