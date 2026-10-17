import {esc,addDays,onDay,parts,stamp} from './display.mjs';
// The reference theme keeps appointments aligned to a shared local-time axis.
export function hubWeekHTML(events,start,pref,today){
 const minute=(date,key,end=false)=>{const p=parts(date,pref.timezone),day=`${p.year}-${p.month}-${p.day}`;return day<key?0:day>key?1440:Number(p.hour)*60+Number(p.minute)+(end&&p.second!=='00'?1:0);};
 const days=Array.from({length:7},(_,i)=>{const date=addDays(start,i);return {date,events:onDay(events,date,pref.timezone)};});
 const timed=days.flatMap(d=>d.events.filter(e=>!e.isAllDay).map(e=>({start:minute(stamp(e),d.date),end:minute(stamp(e,'end'),d.date,true)})));
 const from=Math.min(7,...timed.map(e=>Math.floor(e.start/60))),to=Math.max(22,...timed.map(e=>Math.ceil(e.end/60))),span=(to-from)*60;
 const ticks=Array.from({length:Math.floor((to-Math.ceil(from/2)*2)/2)+1},(_,i)=>Math.ceil(from/2)*2+i*2);
 const colors=['#158ee1','#22a56b','#8961c9','#c34a9a','#df9a35','#db6363','#2da7a4'];
 const title=e=>pref.privacy||e.sensitivity==='private'?'Private appointment':e.subject;
 const color=e=>e.color||colors[[...String(e.subject)].reduce((n,c)=>n+c.charCodeAt(0),0)%colors.length];
 const event=(e,style='')=>`<div class="hubEvent ${e.isAllDay?'hubAllDay':''}" style="--event-color:${esc(color(e))};${style}" title="${esc(e.isAllDay?'All day':stamp(e).toLocaleTimeString('en-GB',{timeZone:pref.timezone,hour:'2-digit',minute:'2-digit',hour12:pref.hour12}))} · ${esc(title(e))}">${e.isAllDay?'':`<time>${stamp(e).toLocaleTimeString('en-GB',{timeZone:pref.timezone,hour:'2-digit',minute:'2-digit',hour12:pref.hour12})}</time>`}<span>${esc(title(e))}</span></div>`;
 return `<div class="hubWeek" style="--hub-hours:${to-from}"><div class="hubAxisColumn"><div class="hubDayHead"></div><div class="hubTimeAxis">${ticks.map(h=>`<span style="top:${(h-from)/(to-from)*100}%">${String(h).padStart(2,'0')}:00</span>`).join('')}</div></div>${days.map(d=>{
  const lanes=[],placed=d.events.filter(e=>!e.isAllDay).map(e=>{const a=minute(stamp(e),d.date),b=minute(stamp(e,'end'),d.date,true);let lane=lanes.findIndex(end=>end<=a);if(lane<0)lane=lanes.length;lanes[lane]=b;return {e,a,b,lane};});
  return `<div class="hubDay ${d.date===today?'hubToday':''}" data-date="${d.date}"><div class="hubDayHead"><strong>${new Date(d.date+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'})}</strong><span>${Number(d.date.slice(-2))} ${new Date(d.date+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',month:'short'})}</span>${d.events.filter(e=>e.isAllDay).map(e=>event(e)).join('')}</div><div class="hubDayBody">${placed.map(({e,a,b,lane})=>event(e,`--event-top:${(a-from*60)/span*100}%;--event-height:${Math.max(20,b-a)/span*100}%;--event-left:${lane/lanes.length*100}%;--event-width:${100/lanes.length}%;`)).join('')}</div></div>`;
 }).join('')}</div>`;
}
