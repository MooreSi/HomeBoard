import {esc,onDay,addDays,range,stamp} from './display.mjs';
// Calendar-day grouping retains all-day dates and local DST boundaries.
export function agendaHTML(events,cursor,pref){
 const [start,defaultEnd]=range(cursor,'agenda'),end=pref.end||defaultEnd,days=[];
 for(let key=start;key<end;key=addDays(key,1)){
  const items=onDay(events,key,pref.timezone).filter(e=>key!==pref.today||!pref.now||e.isAllDay||stamp(e,'end')>new Date(pref.now));if(!items.length)continue;
  const name=key===pref.today?'Today':key===addDays(pref.today,1)?'Tomorrow':new Date(key+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'long'});
  const month=new Date(key+'T12:00:00Z').toLocaleDateString('en-GB',{timeZone:'UTC',month:'short'});
  const time=(e,which)=>stamp(e,which).toLocaleTimeString('en-GB',{timeZone:pref.timezone,hour:'2-digit',minute:'2-digit',hour12:pref.hour12});
  days.push(`<section class="agendaDay" aria-label="${key}"><h3><time datetime="${key}">${Number(key.slice(-2))}</time><span>${name}</span><small>${month}</small></h3>${items.map(e=>{const privateEvent=pref.privacy||e.sensitivity==='private',title=privateEvent?'Private appointment':e.subject,location=privateEvent?'':e.location?.displayName||'';return `<article class="agendaEvent ${e.source==='google'?'blue':''}"><div class="agendaTime">${e.isAllDay?'<strong>All day</strong>':`<strong>${esc(time(e,'start'))}</strong><span>${esc(time(e,'end'))}</span>`}</div><div class="agendaDetails"><strong>${esc(title)}</strong>${location?`<p>${esc(location)}</p>`:''}</div></article>`;}).join('')}</section>`);
 }
 return `<div class="upcomingAgenda">${days.join('')||'<p class="empty">No appointments in the next two weeks.</p>'}</div>`;
}
