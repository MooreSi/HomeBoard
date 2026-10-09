export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parts(date,timezone){return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));}
export function zonedDate(date,timezone){const p=parts(date,timezone);return `${p.year}-${p.month}-${p.day}`;}
export function zonedMidnight(key,timezone){const target=Date.parse(key+'T00:00:00Z');let instant=target;for(let i=0;i<4;i++){const p=parts(new Date(instant),timezone),wall=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);instant+=target-wall;}return new Date(instant);}
export function addDays(key,n){const d=new Date(key+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function weekday(key){return new Date(key+'T12:00:00Z').getUTCDay();}
export function range(cursor,view){if(view==='agenda')return [cursor,addDays(cursor,14)];if(view==='day')return [cursor,addDays(cursor,1)];if(view==='week'||view==='rolling'){const start=addDays(cursor,-((weekday(cursor)+6)%7));return [start,addDays(start,view==='rolling'?21:7)];}const d=new Date(cursor+'T12:00:00Z');return [new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1)).toISOString().slice(0,10),new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)).toISOString().slice(0,10)];}
export function stamp(event,which='start'){const p=event[which],s=p.dateTime;return new Date(s+(p.timeZone==='UTC'&&!/Z|[+-]\d\d:\d\d$/.test(s)?'Z':''));}
export function onDay(events,key,timezone){const start=zonedMidnight(key,timezone),end=zonedMidnight(addDays(key,1),timezone);return events.filter(e=>e.isAllDay?e.start.dateTime.slice(0,10)<=key&&e.end.dateTime.slice(0,10)>key:stamp(e)<end&&stamp(e,'end')>start).sort((a,b)=>stamp(a)-stamp(b));}
export function dateLabel(date,pref){const p=parts(date,pref.timezone);if(pref.dateFormat==='iso')return `${p.year}-${p.month}-${p.day}`;if(pref.dateFormat==='dmy')return `${p.day}/${p.month}/${p.year}`;if(pref.dateFormat==='mdy')return `${p.month}/${p.day}/${p.year}`;return date.toLocaleDateString('en-GB',{timeZone:pref.timezone,weekday:'long',day:'numeric',month:'long',year:'numeric'});}
export async function api(url,options){const response=await fetch(url,options);const j=await response.json();if(!response.ok)throw Error(j.error||'Request failed');return j;}
export const post=(url,value={})=>api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
export function applyTheme(theme){document.body.dataset.theme=theme;}
export function weatherIcon(code){if(code<300)return '⛈';if(code<600)return '☂';if(code<700)return '❄';if(code<800)return '≋';if(code===800)return '☀';return '☁';}

export function nextCalendarPage(cursor,view){if(view==='month'){const d=new Date(cursor+'T12:00:00Z');return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)).toISOString().slice(0,10);}return addDays(cursor,view==='agenda'?14:view==='week'?7:view==='rolling'?21:1);}
