import fs from 'node:fs/promises';
import path from 'node:path';
import {validateDesign} from '../public/design.mjs';
export const themes=[
 {id:'homeboard',name:'HomeBoard',description:'Warm ivory, sage and a family week',layout:'split',colors:['#f6f4ee','#557860','#dce6d8']},
 {id:'midnight',name:'Midnight',description:'Quiet black glass and a clear agenda',layout:'split',colors:['#111827','#8cb5f0','#263348']},
 {id:'chalkboard',name:'Chalkboard',description:'A high-contrast kitchen command centre',layout:'calendar',colors:['#222b28','#a5c9ac','#33483b']},
 {id:'coastal',name:'Coastal',description:'Light blue, sea glass and open space',layout:'split',colors:['#eff7fa','#287b9a','#d0e9ef']},
 {id:'forest',name:'Forest',description:'Deep green with an immersive photo backdrop',layout:'backdrop',colors:['#142d25','#a6d5ae','#31533e']},
 {id:'sunset',name:'Sunset',description:'Warm terracotta and a photo-led layout',layout:'backdrop',colors:['#3a2528','#f1b187','#623c40']},
 {id:'minimal',name:'Minimal',description:'Crisp white and a large monthly planner',layout:'calendar',colors:['#ffffff','#333333','#eeeeee']},
 {id:'lavender',name:'Lavender',description:'Soft lilac for a colourful family planner',layout:'split',colors:['#f5f1fa','#795fa0','#e9def3']},
 {id:'aurora',name:'Aurora',description:'Teal and midnight for a modern information hub',layout:'split',colors:['#10272e','#66d9ca','#21454c']},
 {id:'gallery',name:'Gallery',description:'Your photos take centre stage, with a compact agenda',layout:'gallery',colors:['#f3eee6','#936b43','#e3d7c6']},
 {id:'tide',name:'Tide',description:'Large dates over a teal-to-indigo gradient',layout:'wall',view:'rolling',colors:['#143438','#68e0d3','#315b76']},
 {id:'observatory',name:'Observatory',description:'Photo and weather rail beside a dark three-week planner',layout:'rail',view:'rolling',colors:['#080c12','#ff6459','#172733']},
 {id:'glass',name:'Glasshouse',description:'Full-screen memories with translucent calendar panels',layout:'glass',view:'month',colors:['#15252a','#a8e7dc','#344b56']},
 {id:'folio',name:'Folio',description:'An editorial paper planner with ink-blue appointments',layout:'editorial',view:'month',colors:['#f5f0e4','#264a72','#e4dfd1']},
 {id:'metro',name:'Metro',description:'Edge-to-edge photos, clock and weather beside a black upcoming agenda',layout:'rail',view:'agenda',colors:['#10151c','#8db8ff','#263348']},
 {id:'portrait',name:'Portrait',description:'A vertical photo story above the family calendar',layout:'poster',view:'month',colors:['#f0ece4','#597967','#d8e3d8']},
 {id:'showcase',name:'Showcase',description:'Midnight navy glass with a cyan-to-blue glow, as on the HomeBoard poster',layout:'showcase',colors:['#0b1424','#2fc4f2','#16233a']},
];
export const defaults={calendarFeeds:[],customDesign:null,managementAppearance:'auto',name:'Simon',theme:'homeboard',timezone:'Europe/London',dateFormat:'long',clock:'digital',hour12:false,privacy:false,defaultView:'week',photoSource:'uploads',photoFolder:'',photoInterval:30,photoTransition:'crossfade',photoDuration:1,photoOrder:'sequential',photoFit:'cover',weatherEnabled:false,weatherLocation:null,weatherUnits:'metric',weatherApi:'auto',newsEnabled:false,newsUrl:'',newsLimit:5,nightEnabled:false,nightStart:'22:00',nightEnd:'07:00',nightBrightness:35,microsoftClientId:'',microsoftTenant:'common',googleClientId:'',googleRedirectUri:'http://localhost:8080/api/calendar/google/callback',googleCalendarIds:['primary'],microsoftCalendarIds:['default']};
export async function readJSON(data,name,fallback){try{return JSON.parse(await fs.readFile(path.join(data,name),'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
export async function saveJSON(data,name,value){const file=path.join(data,name),temp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2),{mode:0o600});await fs.rename(temp,file);}
const choices={managementAppearance:['light','dark','auto'],theme:themes.map(x=>x.id),dateFormat:['long','dmy','mdy','iso'],clock:['digital','analog','both'],defaultView:['day','week','month','rolling','agenda'],photoSource:['uploads','folder','both','icloud'],photoTransition:['crossfade','fade','slide','zoom','cut'],photoOrder:['sequential','shuffle'],photoFit:['cover','contain'],weatherUnits:['metric','imperial'],weatherApi:['auto','basic','4.0','3.0']};
const bounds={photoInterval:[5,3600],photoDuration:[0,5],newsLimit:[1,15],nightBrightness:[10,100]};
export function validateSettings(patch,current){
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw Error('Expected settings object');const next={...current};
 for(const [key,value]of Object.entries(patch)){
  if(!Object.hasOwn(defaults,key))throw Error('Unknown setting: '+key);
  if(choices[key]&&!choices[key].includes(value))throw Error('Invalid '+key);
  if(bounds[key]&&(typeof value!=='number'||!Number.isFinite(value)||value<bounds[key][0]||value>bounds[key][1]))throw Error('Invalid '+key);
  if(typeof defaults[key]==='boolean'&&typeof value!=='boolean')throw Error('Invalid '+key);
  if(typeof defaults[key]==='string'&&(typeof value!=='string'||value.length>2048))throw Error('Invalid '+key);
  if(key==='timezone'){try{new Intl.DateTimeFormat('en',{timeZone:value});}catch{throw Error('Invalid timezone');}}
  if(key==='name'&&(value.length>60||!value.trim()))throw Error('Name must contain 1–60 characters');
  if(['nightStart','nightEnd'].includes(key)&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('Invalid time');
  if(['googleCalendarIds','microsoftCalendarIds'].includes(key)&&(!Array.isArray(value)||value.length>20||value.some(x=>typeof x!=='string'||!x||x.length>512)))throw Error('Invalid calendar selection');
  if(key==='microsoftTenant'&&!/^(common|organizations|consumers|[a-f\d-]{36}|[a-z\d.-]+\.[a-z]+)$/i.test(value))throw Error('Invalid Microsoft tenant');
  if(key==='weatherLocation'&&value!==null&&(!value||typeof value.name!=='string'||!Number.isFinite(value.lat)||Math.abs(value.lat)>90||!Number.isFinite(value.lon)||Math.abs(value.lon)>180))throw Error('Invalid weather location');
  if(key==='googleRedirectUri'){const u=new URL(value);if(u.username||u.password||u.search||u.hash||u.pathname!=='/api/calendar/google/callback'||(u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname))))throw Error('Google callback needs HTTPS or localhost HTTP and /api/calendar/google/callback');}
  if(key==='calendarFeeds'){if(!Array.isArray(value)||value.length>20||value.some(v=>!v||Object.keys(v).some(k=>!['id','name','color','person','enabled'].includes(k))||typeof v.id!=='string'||!/^[-a-z\d]{1,80}$/i.test(v.id)||typeof v.name!=='string'||!v.name.trim()||v.name.length>60||!/^#[a-f\d]{6}$/i.test(v.color)||typeof v.person!=='string'||v.person.length>80||typeof v.enabled!=='boolean')||new Set(value.map(v=>v.id)).size!==value.length)throw Error('Invalid calendar feeds');}
  next[key]=key==='customDesign'?validateDesign(value):value;
 }
 if(next.photoDuration>=next.photoInterval)throw Error('Transition must be shorter than the photo interval');
 if(next.photoFolder&&(!path.isAbsolute(next.photoFolder)||next.photoFolder.includes('\0')))throw Error('Photo folder must be an absolute path on the server');
 if(next.newsUrl){const u=new URL(next.newsUrl);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use an HTTP(S) news feed without credentials');}
 return next;
}
