import {isCancelled} from './cancellation.mjs';
import ical from 'node-ical';
import crypto from 'node:crypto';
import {publicText} from './public-http.mjs';
import {readJSON,saveJSON} from './settings.mjs';
const text=value=>String(value?.val??value??'');
function calendarDay(date){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:date.tz||Intl.DateTimeFormat().resolvedOptions().timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
export async function feedEvents(xml,start,end,privacy=false){
 if(!/^BEGIN:VCALENDAR\s*$/m.test(xml)||!/^END:VCALENDAR\s*$/m.test(xml))throw Error('This link is not an ICS calendar. Copy the ICS link, not the HTML link.');
 const parsed=await ical.async.parseICS(xml),events=[],from=new Date(start),to=new Date(end);
 if(text(parsed.vcalendar?.method).toUpperCase()==='CANCEL')return [];
 for(const event of Object.values(parsed)){
  if(event.type!=='VEVENT'||isCancelled(event)||!event.start)continue;
  const instances=ical.expandRecurringEvent(event,{from,to,expandOngoing:true});
  for(const item of instances){if(events.length>=10000)throw Error('Calendar has too many appointments in this period');if(item.start>=to||item.end<=from||isCancelled(item.event||event)||isCancelled({summary:item.summary}))continue;
   const source=item.event||event,full=item.isFullDay;
   events.push({id:'feed:'+crypto.createHash('sha256').update(event.uid+item.start.toISOString()).digest('hex'),source:'feed',subject:privacy||text(source.class).toUpperCase()==='PRIVATE'?'Private appointment':text(item.summary)||'Untitled event',isAllDay:full,start:{dateTime:full?calendarDay(item.start):item.start.toISOString(),timeZone:full?'date':'UTC'},end:{dateTime:full?calendarDay(item.end):item.end.toISOString(),timeZone:full?'date':'UTC'},location:{displayName:text(source.location)}});
  }
 }
 return events.sort((a,b)=>a.start.dateTime.localeCompare(b.start.dateTime));
}
export class CalendarFeed {
 constructor(data,settings,secrets){this.data=data;this.settings=settings;this.secrets=secrets;this.cache={};}
 async init(){this.cache=await readJSON(this.data,'calendar-feed.json',{});}
 async events(start,end){const url=this.secrets().calendarFeedUrl;if(!url)return null;const key=crypto.createHash('sha256').update(JSON.stringify([url,start,end,this.settings().privacy,'cancellation-v2'])).digest('hex');let cached=this.cache[key];
  try{if(!cached||Date.now()-Date.parse(cached.updated)>300000){const xml=await publicText(url,{headers:{Accept:'text/calendar'}});cached={events:await feedEvents(xml,start,end,this.settings().privacy),updated:new Date().toISOString()};this.cache={[key]:cached};await saveJSON(this.data,'calendar-feed.json',this.cache);}return {...cached,stale:false};}
  catch(e){if(cached)return {...cached,stale:true,error:e.message};throw e;}
 }
 async clear(){this.cache={};await saveJSON(this.data,'calendar-feed.json',{});}
}
