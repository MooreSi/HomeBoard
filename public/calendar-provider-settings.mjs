import {api,post,esc} from './display.mjs';
export async function setupCalendarProvider(initial){
 const $=id=>document.getElementById(id);let settings=initial,provider='icloud';
 $('calendarMicrosoftClientId').value=settings.microsoftClientId;
 if(![...$('calendarMicrosoftTenant').options].some(o=>o.value===settings.microsoftTenant))$('calendarMicrosoftTenant').add(new Option('Saved organisation',settings.microsoftTenant));
 $('calendarMicrosoftTenant').value=settings.microsoftTenant;
 $('calendarGoogleClientId').value=settings.googleClientId;$('calendarGoogleRedirect').value=settings.googleRedirectUri;
 $('googleClientSecret').placeholder=settings.googleSecretConfigured?'Configured · leave blank to keep':'Enter OAuth client secret';
 const status=message=>$('providerStatus').textContent=message;
 async function show(){
  for(const p of ['icloud','microsoft','google'])$(p+'Provider').hidden=p!==provider;
  $('oauthControls').hidden=provider==='icloud';$('providerCalendars').replaceChildren();$('providerDisconnect').hidden=true;$('providerSelectionSave').hidden=true;
  $('providerHelp').textContent=provider==='icloud'?'iCloud uses your Apple Account email and an app-specific password.':'This calendar provider uses secure OAuth sign-in. App passwords are not supported by its calendar API. Your account password stays with '+(provider==='microsoft'?'Microsoft.':'Google.');
  if(provider==='icloud')return;const selected=provider;status('Checking connection…');
  try{const value=await api('/api/status');if(selected!==provider)return;if(!value.providers[selected].connected){status('Not connected. Configure the application below, then sign in.');return;}
   const list=await api('/api/calendar/'+selected+'/list');settings=await api('/api/settings');if(selected!==provider)return;
   $('providerCalendars').innerHTML=list.map(c=>`<label class="switch"><input type="checkbox" value="${esc(c.id)}" ${settings[selected+'CalendarIds'].includes(c.id)?'checked':''}>${esc(c.name)}</label>`).join('');$('providerDisconnect').hidden=false;$('providerSelectionSave').hidden=false;status('Connected. Choose calendars to display.');
  }catch(e){if(selected===provider)status(e.message);}
 }
 $('calendarProvider').onchange=()=>{provider=$('calendarProvider').value;$('icloudPassword').value='';$('googleClientSecret').value='';show();};
 $('microsoftConnect').onclick=async()=>{try{$('microsoftDevice').hidden=true;status('Starting Microsoft sign-in…');settings=await post('/api/settings',{microsoftClientId:$('calendarMicrosoftClientId').value.trim(),microsoftTenant:$('calendarMicrosoftTenant').value});const flow=await post('/api/calendar/microsoft/connect',{});const url=new URL(flow.verification_uri);if(url.protocol!=='https:'||!(url.hostname==='microsoft.com'||url.hostname.endsWith('.microsoft.com')))throw Error('Unsupported Microsoft sign-in address');$('microsoftVerify').href=url.href;$('microsoftCode').textContent=flow.user_code;$('microsoftDevice').hidden=false;status('Open Microsoft sign-in, enter the code, then check the connection.');}catch(e){status(e.message);}};
 $('microsoftPoll').onclick=async()=>{try{const result=await post('/api/calendar/microsoft/poll',{});if(result.connected){$('microsoftDevice').hidden=true;await show();}else status('Waiting for Microsoft approval. Complete sign-in and check again.');}catch(e){$('microsoftDevice').hidden=true;status(e.message);}};
 $('googleConnect').onclick=async()=>{try{const patch={googleClientId:$('calendarGoogleClientId').value.trim(),googleRedirectUri:$('calendarGoogleRedirect').value.trim()};if($('googleClientSecret').value)patch.googleClientSecret=$('googleClientSecret').value;settings=await post('/api/settings',patch);$('googleClientSecret').value='';const result=await post('/api/calendar/google/connect',{});const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='accounts.google.com')throw Error('Unsupported Google sign-in address');location.assign(url.href);}catch(e){status(e.message);}};
 $('providerSelectionSave').onclick=async()=>{const selected=provider;try{await post('/api/settings',{[selected+'CalendarIds']:[...$('providerCalendars').querySelectorAll('input:checked')].map(el=>el.value)});status('Calendar selection saved.');}catch(e){status(e.message);}};
 $('providerDisconnect').onclick=async()=>{try{await post('/api/calendar/'+provider+'/disconnect',{});await show();}catch(e){status(e.message);}};
 const connected=new URLSearchParams(location.search).get('connected');if(['microsoft','google'].includes(connected)){provider=connected;$('calendarProvider').value=provider;}await show();
}
