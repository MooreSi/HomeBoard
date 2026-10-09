import {isCancelled} from './cancellation.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {readJSON,saveJSON} from './settings.mjs';
import {CalendarFeed} from './calendar-feed.mjs';
import {jsonFetch} from './http.mjs';
export class Calendars {
 constructor(data,settings,secrets){this.data=data;this.settings=settings;this.secrets=secrets;this.tokens={};this.flow=null;this.pending=new Map();this.refreshes=new Map();this.cache={};this.feed=new CalendarFeed(data,settings,secrets);}
 async init(){this.tokens.microsoft=await readJSON(this.data,'tokens.json',null);this.tokens.google=await readJSON(this.data,'google-tokens.json',null);this.cache=await readJSON(this.data,'calendar.json',{});await this.feed.init();}
 status(){return {microsoft:{configured:!!this.settings().microsoftClientId,connected:!!this.tokens.microsoft},google:{configured:!!this.settings().googleClientId&&!!this.secrets().googleClientSecret,connected:!!this.tokens.google},feed:{configured:!!this.secrets().calendarFeedUrl}};}
 file(p){return p==='microsoft'?'tokens.json':'google-tokens.json';}
 authority(){return `https://login.microsoftonline.com/${this.settings().microsoftTenant}/oauth2/v2.0`;}
 async tokenRequest(p,params){try{return await jsonFetch(p==='microsoft'?this.authority()+'/token':'https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams(params)});}catch(e){if(p==='microsoft'&&(/AADSTS50020/.test(e.providerMessage)||['unauthorized_client','invalid_client'].includes(e.code))){e.microsoftSetup=true;e.message='Microsoft app registration does not allow this account. For Outlook.com choose personal Microsoft accounts in the app registration and select Personal Microsoft accounts here; enable public client flows. Or use the Outlook ICS calendar link below.';}throw e;}}
 async store(p,t){if(!t.access_token)throw Error('Provider did not return an access token');this.tokens[p]={...this.tokens[p],...t,expires:Date.now()+Number(t.expires_in||3600)*1000};await saveJSON(this.data,this.file(p),this.tokens[p]);}
 async access(p){const t=this.tokens[p];if(!t)throw Error('Calendar is not connected');if(Date.now()<t.expires-60000)return t.access_token;
  if(!this.refreshes.has(p))this.refreshes.set(p,(async()=>{if(!t.refresh_token)throw Error('Sign-in expired. Reconnect the calendar.');const s=this.settings();await this.store(p,await this.tokenRequest(p,{grant_type:'refresh_token',refresh_token:t.refresh_token,client_id:p==='microsoft'?s.microsoftClientId:s.googleClientId,...(p==='google'?{client_secret:this.secrets().googleClientSecret}:{})}));return this.tokens[p].access_token;})().finally(()=>this.refreshes.delete(p)));
  return this.refreshes.get(p);
 }
 async connectMicrosoft(){const s=this.settings();if(!s.microsoftClientId)throw Error('Add a Microsoft application client ID in settings first.');const f=await jsonFetch(this.authority()+'/devicecode',{method:'POST',body:new URLSearchParams({client_id:s.microsoftClientId,scope:'Calendars.ReadBasic offline_access'})});this.flow={...f,until:Date.now()+f.expires_in*1000,next:0};return {user_code:f.user_code,verification_uri:f.verification_uri,interval:f.interval,expires_in:f.expires_in};}
 async pollMicrosoft(){const f=this.flow;if(!f||Date.now()>f.until){this.flow=null;throw Error('Sign-in expired. Start again.');}if(Date.now()<f.next)return {pending:true};f.next=Date.now()+f.interval*1000;
  try{await this.store('microsoft',await this.tokenRequest('microsoft',{client_id:this.settings().microsoftClientId,grant_type:'urn:ietf:params:oauth:grant-type:device_code',device_code:f.device_code}));this.flow=null;await this.clearCache();return {connected:true};}catch(e){if(['authorization_pending','slow_down'].includes(e.code)){if(e.code==='slow_down')f.interval+=5;return {pending:true};}this.flow=null;throw Error(e.microsoftSetup?e.message:'Microsoft sign-in was denied or expired. Try connecting again.');}
 }
 connectGoogle(){const s=this.settings();if(!s.googleClientId||!this.secrets().googleClientSecret)throw Error('Add a Google OAuth client ID and secret first.');
  for(const [key,v]of this.pending)if(Date.now()>v.until)this.pending.delete(key);if(this.pending.size>=20)throw Error('Too many pending sign-ins. Try again in ten minutes.');
  const state=crypto.randomBytes(32).toString('base64url'),session=crypto.randomBytes(32).toString('base64url'),verifier=crypto.randomBytes(48).toString('base64url');this.pending.set(state,{session,verifier,until:Date.now()+600000,redirect:s.googleRedirectUri});
  const params=new URLSearchParams({client_id:s.googleClientId,redirect_uri:s.googleRedirectUri,response_type:'code',scope:'https://www.googleapis.com/auth/calendar.readonly',access_type:'offline',prompt:'consent',state,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'});
  return {url:'https://accounts.google.com/o/oauth2/v2/auth?'+params,cookie:`homeboard_oauth=${session}; HttpOnly; SameSite=Lax; Path=/api/calendar/google/callback; Max-Age=600${s.googleRedirectUri.startsWith('https:')?'; Secure':''}`};
 }
 async callbackGoogle(u,cookie){const state=u.searchParams.get('state'),f=this.pending.get(state);const session=cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('homeboard_oauth='))?.slice('homeboard_oauth='.length);
  if(!f||Date.now()>f.until||!session||session!==f.session)throw Error('Invalid or expired Google sign-in session. Start again from settings.');this.pending.delete(state);
  if(u.searchParams.has('error'))throw Error('Google consent was denied. No calendar was connected.');const code=u.searchParams.get('code');if(!code)throw Error('Missing Google authorization code');
  await this.store('google',await this.tokenRequest('google',{client_id:this.settings().googleClientId,client_secret:this.secrets().googleClientSecret,grant_type:'authorization_code',code,redirect_uri:f.redirect,code_verifier:f.verifier}));await this.clearCache();
 }
 async clearCache(){this.cache={};await this.feed.clear();await fs.rm(path.join(this.data,'calendar.json'),{force:true});}
 async disconnect(p){this.tokens[p]=null;if(p==='microsoft')this.flow=null;else this.pending.clear();await fs.rm(path.join(this.data,this.file(p)),{force:true});await this.clearCache();}
 async calendars(p){const token=await this.access(p);let url=p==='microsoft'?'https://graph.microsoft.com/v1.0/me/calendars':'https://www.googleapis.com/calendar/v3/users/me/calendarList';let results=[];
  for(let page=0;url&&page<100;page++){const j=await jsonFetch(url,{headers:{Authorization:'Bearer '+token}});if(p==='microsoft'){results.push(...j.value.map(x=>({id:x.id,name:x.name,primary:!!x.isDefaultCalendar})));url=j['@odata.nextLink']||null;if(url&&new URL(url).origin!=='https://graph.microsoft.com')throw Error('Invalid calendar pagination');}else{results.push(...j.items.map(x=>({id:x.id,name:x.summary,primary:!!x.primary})));url=j.nextPageToken?'https://www.googleapis.com/calendar/v3/users/me/calendarList?'+new URLSearchParams({pageToken:j.nextPageToken}):null;}}
  if(url)throw Error('Calendar list pagination limit exceeded');return results;
 }
 async providerEvents(p,start,end){const s=this.settings(),ids=p==='microsoft'?s.microsoftCalendarIds:s.googleCalendarIds;const token=await this.access(p);let result=[];
  for(const id of ids){let params=new URLSearchParams(p==='microsoft'?{startDateTime:start,endDateTime:end,'$top':'100','$select':'id,subject,start,end,isAllDay,sensitivity,location,isCancelled'}:{timeMin:start,timeMax:end,singleEvents:'true',orderBy:'startTime',maxResults:'250'});
   const endpoint=p==='microsoft'?`https://graph.microsoft.com/v1.0/me/${id==='default'?'calendar':'calendars/'+encodeURIComponent(id)}/calendarView`:`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`;
   let url=endpoint+'?'+params;
   for(let page=0;url&&page<100;page++){
    const j=await jsonFetch(url,{headers:{Authorization:'Bearer '+token,...(p==='microsoft'?{Prefer:'outlook.timezone="UTC"'}:{})}});
    const values=p==='microsoft'?j.value:j.items;if(!Array.isArray(values))throw Error('Provider returned no calendar event list');
    result.push(...values.filter(e=>!isCancelled(e)).map(e=>p==='microsoft'?{...e,id:`microsoft:${id}:${e.id}`,source:p,calendarId:id,subject:s.privacy||e.sensitivity==='private'?'Private appointment':e.subject}:{id:`google:${id}:${e.id}`,source:p,calendarId:id,subject:s.privacy||e.visibility==='private'?'Private appointment':e.summary||'Untitled event',sensitivity:e.visibility==='private'?'private':'normal',isAllDay:!!e.start.date,start:{dateTime:e.start.date||e.start.dateTime,timeZone:e.start.date?'date':e.start.timeZone||'UTC'},end:{dateTime:e.end.date||e.end.dateTime,timeZone:e.end.date?'date':e.end.timeZone||'UTC'},location:{displayName:e.location||''}}));
    if(p==='microsoft'){url=j['@odata.nextLink']||null;if(url&&new URL(url).origin!=='https://graph.microsoft.com')throw Error('Invalid event pagination URL');}else{url=j.nextPageToken?endpoint+'?'+new URLSearchParams({...Object.fromEntries(params),pageToken:j.nextPageToken}):null;}
   }
   if(url)throw Error('Calendar event pagination limit exceeded');
  }
  return result;
 }
 async events(start,end){if(!start||!end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.parse(start)||Date.parse(end)-Date.parse(start)>93*86400000)throw Error('Invalid calendar range (maximum 93 days)');
  const providers=['microsoft','google'].filter(p=>this.tokens[p]);if(!providers.length&&!this.secrets().calendarFeedUrl)return {demo:true,events:[]};
  let events=[],errors=[],stale=false,updated=[];
  if(this.secrets().calendarFeedUrl){try{const f=await this.feed.events(start,end);events.push(...f.events);updated.push(f.updated);if(f.stale){stale=true;errors.push({provider:'feed',error:f.error});}}catch(e){errors.push({provider:'feed',error:e.message});}}
  for(const p of providers){const ids=p==='microsoft'?this.settings().microsoftCalendarIds:this.settings().googleCalendarIds,key=JSON.stringify([p,ids,start,end,this.settings().privacy,'cancellation-v2']);let cached=this.cache[key];
   try{if(!cached||Date.now()-Date.parse(cached.updated)>300000){cached={events:await this.providerEvents(p,start,end),updated:new Date().toISOString()};this.cache[key]=cached;const keys=Object.keys(this.cache);for(const k of keys.slice(0,Math.max(0,keys.length-60)))delete this.cache[k];await saveJSON(this.data,'calendar.json',this.cache);}events.push(...cached.events);updated.push(cached.updated);}catch(e){errors.push({provider:p,error:e.message});if(cached){stale=true;events.push(...cached.events);updated.push(cached.updated);}}
  }
  return {demo:false,events:events.filter(e=>!isCancelled(e)),stale,errors,updated:updated.sort()[0]||null};
 }
}
