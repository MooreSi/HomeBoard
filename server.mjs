import {newsFeeds} from './lib/news-feeds.mjs';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {defaults,themes,readJSON,saveJSON,validateSettings} from './lib/settings.mjs';
import {Calendars} from './lib/calendar.mjs';
import {Photos} from './lib/photos.mjs';
import {Weather} from './lib/weather.mjs';
import {ICloudAlbum,albumToken} from './lib/icloud.mjs';
import {publicURL} from './lib/http.mjs';
import {updateRequest} from './lib/update-channel.mjs';
import {Family} from './lib/family.mjs';
import {Auth} from './lib/auth.mjs';
import {Backup} from './lib/backup.mjs';
import {News} from './lib/news.mjs';
const root=path.dirname(fileURLToPath(import.meta.url)),data=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const packageInfo=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
await fs.mkdir(path.join(data,'photos'),{recursive:true});
let settings={...defaults,...await readJSON(data,'settings.json',{})};
if(!themes.some(theme=>theme.id===settings.theme)){settings.theme=defaults.theme;await saveJSON(data,'settings.json',settings);}
let secrets=await readJSON(data,'secrets.json',{});
function applyEnvironment(){
settings.microsoftClientId=process.env.MICROSOFT_CLIENT_ID||settings.microsoftClientId;
settings.microsoftTenant=process.env.MICROSOFT_TENANT||settings.microsoftTenant;
settings.googleClientId=process.env.GOOGLE_CLIENT_ID||settings.googleClientId;
settings.googleRedirectUri=process.env.GOOGLE_REDIRECT_URI||settings.googleRedirectUri;
settings.photoFolder=process.env.PHOTO_FOLDER||settings.photoFolder;
secrets.googleClientSecret=process.env.GOOGLE_CLIENT_SECRET||secrets.googleClientSecret||'';
secrets.weatherApiKey=process.env.OPENWEATHER_API_KEY||secrets.weatherApiKey||'';
}
applyEnvironment();
const calendars=new Calendars(data,()=>settings,()=>secrets),album=new ICloudAlbum(()=>secrets),photos=new Photos(data,()=>settings,album),weather=new Weather(data,()=>settings,()=>secrets),news=new News(data,()=>settings);
const family=new Family(data),auth=new Auth(data),backup=new Backup(data,()=>({settings,secrets}));
await Promise.all([calendars.init(),weather.init(),news.init(),family.init(),auth.init()]);
function publicSettings(){return {...settings,calendarFeedConfigured:!!secrets.calendarFeedUrl,icloudAlbumConfigured:!!secrets.icloudAlbumUrl,googleSecretConfigured:!!secrets.googleClientSecret,weatherKeyConfigured:!!secrets.weatherApiKey};}
async function body(req,limit=12*1024*1024){let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>limit)throw Error('Maximum upload size is 12 MB');chunks.push(c);}return Buffer.concat(chunks);}
async function payload(req){return JSON.parse((await body(req,65536)).toString());}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function update(patch){const nextSecrets={...secrets},clean={...patch};for(const k of ['googleClientSecret','weatherApiKey','calendarFeedUrl','icloudAlbumUrl'])if(Object.hasOwn(clean,k)){if(typeof clean[k]!=='string'||clean[k].length>2048)throw Error('Invalid credential');nextSecrets[k]=clean[k];delete clean[k];}
 if(Object.hasOwn(patch,'calendarFeedUrl'))nextSecrets.calendarFeedUrl=nextSecrets.calendarFeedUrl.trim().replace(/^webcal:\/\//i,'https://');
 if(nextSecrets.icloudAlbumUrl)albumToken(nextSecrets.icloudAlbumUrl);
 if(Object.hasOwn(patch,'calendarFeedUrl')&&nextSecrets.calendarFeedUrl){const u=await publicURL(nextSecrets.calendarFeedUrl);if(u.protocol!=='https:')throw Error('Use an HTTPS ICS calendar link');}
 if(Object.hasOwn(clean,'feedConnections')){const items=clean.feedConnections;if(!Array.isArray(items)||items.length>20)throw Error('Invalid calendar connections');nextSecrets.calendarFeeds={};clean.calendarFeeds=[];for(const item of items){const id=item.id||crypto.randomUUID(),old=secrets.calendarFeeds?.[id],url=(item.url||old||'').trim().replace(/^webcal:\/\//i,'https://');if(url){const u=await publicURL(url);if(u.protocol!=='https:')throw Error('Use an HTTPS ICS calendar link');nextSecrets.calendarFeeds[id]=url;}else throw Error('A new calendar needs an ICS link');clean.calendarFeeds.push({id,name:item.name,color:item.color,person:item.person||'',enabled:item.enabled});}delete clean.feedConnections;}
 const next=validateSettings(clean,settings);
 if(next.microsoftClientId!==settings.microsoftClientId||next.microsoftTenant!==settings.microsoftTenant)await calendars.disconnect('microsoft');
 if(next.googleClientId!==settings.googleClientId||next.googleRedirectUri!==settings.googleRedirectUri||nextSecrets.googleClientSecret!==secrets.googleClientSecret)await calendars.disconnect('google');
 if(next.privacy!==settings.privacy||nextSecrets.calendarFeedUrl!==secrets.calendarFeedUrl||JSON.stringify(next.calendarFeeds)!==JSON.stringify(settings.calendarFeeds)||JSON.stringify(nextSecrets.calendarFeeds)!==JSON.stringify(secrets.calendarFeeds))await calendars.clearCache();
 await saveJSON(data,'secrets.json',nextSecrets);await saveJSON(data,'settings.json',next);secrets=nextSecrets;settings=next;
 return publicSettings();
}
let mutationQueue=Promise.resolve();
const server=http.createServer(async(req,res)=>{let unlock;try{
 const u=new URL(req.url,'http://localhost');
 if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Cross-origin request rejected'});
 if(req.method==='POST'){const previous=mutationQueue;mutationQueue=new Promise(r=>unlock=r);await previous;}
 if(u.pathname==='/api/auth/status'&&req.method==='GET')return json(res,200,auth.status(req));
 if(['/api/auth/setup','/api/auth/login'].includes(u.pathname)&&req.method==='POST'){const {password}=await payload(req);res.setHeader('Set-Cookie',await (u.pathname.endsWith('setup')?auth.setup(req,password):auth.login(req,password)));return json(res,200,auth.status(req));}
 if(u.pathname==='/api/auth/logout'&&req.method==='POST'){res.setHeader('Set-Cookie',auth.logout(req));return json(res,200,{ok:true});}
 if(req.method==='POST')auth.require(req);
 if(req.method==='GET'&&(u.pathname==='/api/settings'||/^\/api\/calendar\/(microsoft|google)\/list$/.test(u.pathname)||['/api/photos/uploads','/api/photos/folder'].includes(u.pathname)))auth.require(req);
 if(u.pathname==='/api/family'&&req.method==='GET')return json(res,200,family.value);
 if(u.pathname==='/api/family'&&req.method==='POST')return json(res,200,await family.mutate(await payload(req)));
 if(u.pathname==='/api/display-settings'&&req.method==='GET'){const value=publicSettings();for(const k of ['photoFolder','microsoftClientId','microsoftTenant','googleClientId','googleRedirectUri','googleCalendarIds','microsoftCalendarIds'])delete value[k];return json(res,200,value);}
 if(u.pathname==='/api/backup/create'&&req.method==='POST')return json(res,200,await backup.create((await payload(req)).password));
 if(u.pathname==='/api/backup/restore'&&req.method==='POST'){const p=JSON.parse((await body(req,150*1024*1024)).toString()),result=await backup.restore(p.backup,p.password);settings={...defaults,...await readJSON(data,'settings.json',{})};secrets=await readJSON(data,'secrets.json',{});applyEnvironment();await Promise.all([family.init(),calendars.init(),weather.init(),news.init()]);await calendars.clearCache();return json(res,200,result);}
 if(u.pathname==='/api/backup/list'&&req.method==='GET'){auth.require(req);return json(res,200,await backup.list());}
 if(u.pathname==='/api/health'&&req.method==='GET'){auth.require(req);return json(res,200,{version:packageInfo.version,calendar:calendars.status(),weather:{enabled:settings.weatherEnabled,key:!!secrets.weatherApiKey,location:!!settings.weatherLocation},news:{enabled:settings.newsEnabled,configured:!!settings.newsUrl},photos:await photos.list().then(x=>({count:x.length})).catch(e=>({error:e.message})),backups:await backup.list(),offline:'Browser cache stores the last successful display responses; settings and edits are never cached.'});}
 if(u.pathname==='/api/update/status'&&req.method==='GET')return json(res,200,await updateRequest('status'));
 if(['/api/update/check','/api/update/install'].includes(u.pathname)&&req.method==='POST'){if(req.headers['content-type']!=='application/json')throw Error('Update requests require application/json');return json(res,u.pathname.endsWith('/install')?202:200,await updateRequest(u.pathname.endsWith('/install')?'install':'check'));}
 if(u.pathname==='/api/settings'&&req.method==='GET')return json(res,200,publicSettings());
 if(u.pathname==='/api/settings'&&req.method==='POST')return json(res,200,await update(await payload(req)));
 if(u.pathname==='/api/themes'&&req.method==='GET')return json(res,200,themes);
 if(u.pathname==='/api/status'&&req.method==='GET'){const providers=calendars.status();return json(res,200,{configured:providers.microsoft.configured,connected:providers.microsoft.connected,providers});}
 if(u.pathname==='/api/events'&&req.method==='GET')return json(res,200,await calendars.events(u.searchParams.get('start'),u.searchParams.get('end')));
 if(['/api/connect','/api/calendar/microsoft/connect'].includes(u.pathname)&&req.method==='POST')return json(res,200,await calendars.connectMicrosoft());
 if(['/api/poll','/api/calendar/microsoft/poll'].includes(u.pathname)&&req.method==='POST')return json(res,200,await calendars.pollMicrosoft());
 if(['/api/disconnect','/api/calendar/microsoft/disconnect'].includes(u.pathname)&&req.method==='POST'){await calendars.disconnect('microsoft');return json(res,200,{ok:true});}
 if(u.pathname==='/api/calendar/google/connect'&&req.method==='POST'){const result=calendars.connectGoogle();res.setHeader('Set-Cookie',result.cookie);return json(res,200,{url:result.url});}
 if(u.pathname==='/api/calendar/google/callback'&&req.method==='GET'){res.setHeader('Referrer-Policy','no-referrer');await calendars.callbackGoogle(u,req.headers.cookie);res.writeHead(303,{Location:'/settings?connected=google','Set-Cookie':'homeboard_oauth=; HttpOnly; SameSite=Lax; Path=/api/calendar/google/callback; Max-Age=0'});return res.end();}
 if(u.pathname==='/api/calendar/google/disconnect'&&req.method==='POST'){await calendars.disconnect('google');return json(res,200,{ok:true});}
 const calendarList=u.pathname.match(/^\/api\/calendar\/(microsoft|google)\/list$/);if(calendarList&&req.method==='GET')return json(res,200,await calendars.calendars(calendarList[1]));
 if(u.pathname==='/api/weather/locations'&&req.method==='GET')return json(res,200,await weather.locations(u.searchParams.get('q')));
 if(u.pathname==='/api/weather'&&req.method==='GET')return json(res,200,await weather.forecast());
 if(u.pathname==='/api/news/feeds'&&req.method==='GET')return json(res,200,newsFeeds);
 if(u.pathname==='/api/news'&&req.method==='GET')return json(res,200,await news.headlines());
 if(u.pathname==='/api/photos/icloud'&&req.method==='POST')return json(res,200,await album.scan(true));
 if(u.pathname.startsWith('/icloud-photos/')&&req.method==='GET'){const photo=await album.read(u.pathname.slice(15));res.writeHead(200,{'Content-Type':photo.type,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=300'});return res.end(photo.body);}
 if(u.pathname==='/api/photos/uploads'&&req.method==='GET')return json(res,200,(await fs.readdir(path.join(data,'photos'))).filter(x=>x.endsWith('.jpg')).sort().map(x=>'/photos/'+x));
 if(u.pathname==='/api/photos'&&req.method==='GET')return json(res,200,await photos.list());
 if(u.pathname==='/api/photos/folder'&&req.method==='GET'){await photos.scan();return json(res,200,photos.folderStatus);}
 if(u.pathname.startsWith('/folder-photos/')&&req.method==='GET'){const photo=await photos.read(u.pathname.slice(15));res.writeHead(200,{'Content-Type':photo.type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});return res.end(photo.body);}
 if(u.pathname==='/api/photos'&&req.method==='POST'){const b=await body(req);if(b[0]!==0xff||b[1]!==0xd8)throw Error('Upload a JPEG image');const name=crypto.randomUUID()+'.jpg';await fs.writeFile(path.join(data,'photos',name),b,{mode:0o600});return json(res,201,{url:'/photos/'+name});}
 if(u.pathname==='/api/photos/delete'&&req.method==='POST'){const {url}=await payload(req);if(!/^\/photos\/[a-f0-9-]+\.jpg$/.test(url))throw Error('Invalid photo (folder photos are read-only)');await fs.rm(path.join(data,url.slice(1)),{force:true});return json(res,200,{ok:true});}
 if(u.pathname==='/api/system'&&req.method==='GET'){const port=server.address().port;return json(res,200,{version:packageInfo.version,commit:process.env.HOMEBOARD_COMMIT||null,urls:[...new Set([`http://${req.headers.host||'localhost:'+port}`,...(process.env.LAN_URLS?process.env.LAN_URLS.split(',').filter(x=>/^https?:\/\/[^\s]+$/.test(x)):Object.values(os.networkInterfaces()).flat().filter(x=>x&&!x.internal&&x.family==='IPv4').map(x=>`http://${x.address}:${port}`))])]});}
 if(u.pathname.startsWith('/api/'))return json(res,req.method==='GET'?404:405,{error:'Unknown API route or method'});
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const isPhoto=u.pathname.startsWith('/photos/'),base=isPhoto?data:path.join(root,'public');
 const route=u.pathname==='/'?'/index.html':u.pathname==='/settings'||u.pathname==='/settings/'?'/settings.html':u.pathname==='/family'?'/family.html':u.pathname==='/login'?'/login.html':u.pathname;
 const file=path.resolve(base,'.'+decodeURIComponent(route));if(!file.startsWith(base+path.sep))return json(res,403,{error:'Forbidden'});
 // Only the public tree and uploaded photos are available, never runtime data.
 if(isPhoto&&!/^\/photos\/[a-f0-9-]+\.jpg$/.test(u.pathname))return json(res,404,{error:'Photo not found'});
 const b=await fs.readFile(file),ext=path.extname(file),types={'.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json','.ttf':'font/ttf','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg'};
 res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; img-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'"});res.end(b);
 }catch(e){json(res,e.status||(e.code==='ENOENT'?404:400),{error:e.code==='ENOENT'?'Not found':e.message});}finally{unlock?.();}});
server.listen(Number(process.env.PORT||8080),process.env.HOST||'0.0.0.0',()=>{console.log('HomeBoard listening on port '+server.address().port);if(process.send)process.send({type:'ready',port:server.address().port});});
