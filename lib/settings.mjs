import fs from 'node:fs/promises';
import path from 'node:path';
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
];
export const defaults={name:'Simon',theme:'homeboard',timezone:'Europe/London',dateFormat:'long',clock:'digital',hour12:false,privacy:false,defaultView:'week',photoSource:'uploads',photoFolder:'',photoInterval:30,photoTransition:'crossfade',photoDuration:1,photoOrder:'sequential',photoFit:'cover',weatherEnabled:false,weatherLocation:null,weatherUnits:'metric',weatherApi:'4.0',newsEnabled:false,newsUrl:'',newsLimit:5,nightEnabled:false,nightStart:'22:00',nightEnd:'07:00',nightBrightness:35,microsoftClientId:'',microsoftTenant:'common',googleClientId:'',googleRedirectUri:'http://localhost:8080/api/calendar/google/callback',googleCalendarIds:['primary'],microsoftCalendarIds:['default']};
export async function readJSON(data,name,fallback){try{return JSON.parse(await fs.readFile(path.join(data,name),'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
export async function saveJSON(data,name,value){const file=path.join(data,name),temp=file+'.'+crypto.randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2),{mode:0o600});await fs.rename(temp,file);}
const choices={theme:themes.map(x=>x.id),dateFormat:['long','dmy','mdy','iso'],clock:['digital','analog','both'],defaultView:['day','week','month'],photoSource:['uploads','folder','both'],photoTransition:['crossfade','fade','slide','zoom','cut'],photoOrder:['sequential','shuffle'],photoFit:['cover','contain'],weatherUnits:['metric','imperial'],weatherApi:['4.0','3.0']};
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
  next[key]=value;
 }
 if(next.photoDuration>=next.photoInterval)throw Error('Transition must be shorter than the photo interval');
 if(next.photoFolder&&(!path.isAbsolute(next.photoFolder)||next.photoFolder.includes('\0')))throw Error('Photo folder must be an absolute path on the server');
 if(next.newsUrl){const u=new URL(next.newsUrl);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Use an HTTP(S) news feed without credentials');}
 return next;
}
