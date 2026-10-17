import {setupCalendarProvider} from './calendar-provider-settings.mjs';
import {api,post,esc} from './display.mjs';
export async function setupICloudCalendar(){
 const $=id=>document.getElementById(id);let settings=await api('/api/settings');
 const status=text=>{$('icloudStatus').textContent=text;};
 async function show(calendars){
  settings=await api('/api/settings');$('icloudDisconnect').hidden=!settings.icloudCalendarConfigured;$('icloudSelectionSave').hidden=!settings.icloudCalendarConfigured;
  if(!settings.icloudCalendarConfigured){$('icloudCalendars').replaceChildren();status('No iCloud calendar connected.');return;}
  const list=calendars||await api('/api/calendar/icloud/list');
  $('icloudCalendars').innerHTML=list.map(c=>`<label class="switch"><input type="checkbox" value="${esc(c.id)}" ${settings.icloudCalendarIds.includes(c.id)?'checked':''}>${esc(c.name)}</label>`).join('');status('iCloud connected. Choose calendars to display.');
 }
 $('icloudConnect').onclick=async()=>{
  $('icloudConnect').disabled=true;status('Connecting to iCloud…');
  try{const result=await post('/api/calendar/icloud/connect',{email:$('icloudEmail').value,password:$('icloudPassword').value});$('icloudEmail').value='';await show(result.calendars);}catch(e){status(e.message);}finally{$('icloudPassword').value='';$('icloudConnect').disabled=false;}
 };
 $('icloudSelectionSave').onclick=async()=>{try{await post('/api/settings',{icloudCalendarIds:[...$('icloudCalendars').querySelectorAll('input:checked')].map(el=>el.value)});status('Calendar selection saved.');}catch(e){status(e.message);}};
 $('icloudDisconnect').onclick=async()=>{try{await post('/api/calendar/icloud/disconnect',{});await show();$('icloudEmail').value='';$('icloudPassword').value='';status('iCloud calendar disconnected.');}catch(e){status(e.message);}};
 try{await show();}catch(e){status(e.message);}
 await setupCalendarProvider(settings);
}
