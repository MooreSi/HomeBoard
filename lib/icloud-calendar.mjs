import {calendarURL} from './icloud-calendar-config.mjs';
import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {publicRequest} from './public-http.mjs';
import {feedEvents} from './calendar-feed.mjs';
const parser=new XMLParser({removeNSPrefix:true,parseTagValue:false,trimValues:false});
const array=value=>value===undefined?[]:Array.isArray(value)?value:[value];
export class ICloudCalendar {
 async request(url,credentials,method,properties,depth='0'){
  calendarURL(url);
  const body=`<?xml version="1.0" encoding="utf-8"?><${method==='REPORT'?'c:calendar-query':'d:propfind'} xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">${properties}</${method==='REPORT'?'c:calendar-query':'d:propfind'}>`;
  const r=await publicRequest(url,{method,body,headers:{Authorization:'Basic '+Buffer.from(credentials.email+':'+credentials.password).toString('base64'),'Content-Type':'application/xml; charset=utf-8',Depth:depth},allowedHost:u=>{calendarURL(u.href);return true;}});
  if([401,403].includes(r.status))throw Error('iCloud sign-in failed. Check your Apple Account email and app-specific password.');
  if(r.status!==207)throw Error(`iCloud calendar request failed (${r.status}). Try again later.`);
  const xml=r.body.toString('utf8');if(/<!DOCTYPE/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('iCloud returned an invalid calendar response');
  const document=parser.parse(xml);if(!Object.hasOwn(document,'multistatus'))throw Error('iCloud returned an invalid calendar response');
  return array(document.multistatus.response).map(response=>({href:response.href,props:Object.assign({},...array(response.propstat).filter(p=>/\s200\s/.test(p.status)).map(p=>p.prop))}));
 }
 async discover(credentials){
  const root='https://caldav.icloud.com/';
  const principal=(await this.request(root,credentials,'PROPFIND','<d:prop><d:current-user-principal/></d:prop>'))[0]?.props['current-user-principal']?.href;
  if(typeof principal!=='string')throw Error('iCloud did not return a calendar principal');
  const principalURL=calendarURL(principal,root);
  const home=(await this.request(principalURL,credentials,'PROPFIND','<d:prop><c:calendar-home-set/></d:prop>'))[0]?.props['calendar-home-set']?.href;
  if(typeof home!=='string')throw Error('iCloud did not return a calendar home');
  const homeURL=calendarURL(home,principalURL);
  const rows=await this.request(homeURL,credentials,'PROPFIND','<d:prop><d:displayname/><d:resourcetype/></d:prop>','1');
  const calendars=rows.filter(r=>r.props.resourcetype&&Object.hasOwn(r.props.resourcetype,'calendar')).map(r=>({id:calendarURL(r.href,homeURL),name:r.props.displayname||'iCloud calendar'}));
  if(!calendars.length)throw Error('No iCloud calendars were found');
  if(calendars.length>20)throw Error('iCloud returned too many calendars (maximum 20)');
  return calendars;
 }
 async events(credentials,ids,start,end,privacy){
  const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');let events=[];
  for(const id of ids){const rows=await this.request(calendarURL(id),credentials,'REPORT',`<d:prop><c:calendar-data/></d:prop><c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT"><c:time-range start="${stamp(start)}" end="${stamp(end)}"/></c:comp-filter></c:comp-filter></c:filter>`,'1');
   for(const row of rows){const data=row.props['calendar-data'];if(typeof data!=='string')throw Error('iCloud returned an appointment without calendar data');events.push(...(await feedEvents(data,start,end,privacy)).map(e=>({...e,id:'icloud:'+id+':'+e.id,source:'icloud',calendarId:id})));}
  }
  return events;
 }
}
