import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {app} from './helpers/app.mjs';
const range='/api/events?start=2026-10-01T00:00:00Z&end=2026-11-01T00:00:00Z';
async function microsoft(a){assert.equal((await a.post('/api/settings',{microsoftClientId:'fake-ms-client'})).status,200);assert.equal((await a.post('/api/calendar/microsoft/connect',{})).status,200);assert.equal((await a.post('/api/calendar/microsoft/poll',{})).status,200);}
async function google(a){
 assert.equal((await a.post('/api/settings',{googleClientId:'fake-google-client',googleClientSecret:'fake-google-secret'})).status,200);
 const response=await a.post('/api/calendar/google/connect',{});assert.equal(response.status,200);const {url}=await response.json();const state=new URL(url).searchParams.get('state');assert.ok(state);
 const cookie=response.headers.get('set-cookie').split(';')[0];const callback=await a.request('/api/calendar/google/callback?code=fake-code&state='+state,{headers:{Cookie:cookie},redirect:'manual'});assert.equal(callback.status,303);
}
test('Microsoft work/personal connection pages events with private titles redacted',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);const s=await a.json('/api/status');assert.equal(s.providers.microsoft.connected,true);
 const events=await a.json(range);assert.equal(events.demo,false);assert.equal(events.events.length,2);assert.equal(events.events[0].subject,'Private appointment');assert.equal(events.events[1].isAllDay,true);
 assert.doesNotMatch(JSON.stringify(s),/secret-ms/);const file=JSON.parse(await fs.readFile(path.join(a.data,'tokens.json'),'utf8'));assert.equal(file.access_token,'secret-ms-access');
});
test('Google OAuth and Microsoft calendars merge expanded paginated events',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);await google(a);const r=await a.json(range);assert.equal(r.events.length,4);assert.equal(r.events.filter(x=>x.source==='google').length,2);assert.equal(r.events.find(x=>x.id==='google:primary:g-day').start.dateTime,'2026-10-10');
 await a.restart();assert.equal((await a.json('/api/status')).providers.google.connected,true);
});
test('Google callback rejects missing browser session and mismatched state',async t=>{
 const a=await app(t,{fake:true});assert.equal((await a.request('/api/calendar/google/callback?code=x&state=wrong',{redirect:'manual'})).status,400);
 assert.equal((await a.json('/api/status')).providers.google.connected,false);
});
test('disconnect clears provider credentials and events cache',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);await a.json(range);assert.equal((await a.post('/api/calendar/microsoft/disconnect',{})).status,200);
 assert.equal((await a.json(range)).demo,true);await assert.rejects(fs.readFile(path.join(a.data,'tokens.json')), {code:'ENOENT'});
});
test('weather resolves a location and provides seven real-provider-shaped days',async t=>{
 const a=await app(t,{fake:true});assert.equal((await a.post('/api/settings',{weatherApiKey:'fake-weather-key'})).status,200);
 const places=await a.json('/api/weather/locations?q=London');assert.equal(places[0].name,'London, GB');
 assert.equal((await a.post('/api/settings',{weatherEnabled:true,weatherLocation:places[0]})).status,200);const weather=await a.json('/api/weather');assert.equal(weather.days.length,7);assert.equal(weather.days[0].max,15);assert.equal(weather.days[0].rain,20);assert.equal(weather.units,'metric');
});
test('enabled weather fails honestly without an API key',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{weatherEnabled:true,weatherLocation:{name:'London',lat:51.5,lon:-.1}})).status,200);const r=await a.request('/api/weather');assert.equal(r.status,400);assert.match((await r.json()).error,/API key/);
});
test('RSS returns safe text and drops unsafe headline links',async t=>{
 const a=await app(t,{fake:true});assert.equal((await a.post('/api/settings',{newsEnabled:true,newsUrl:'https://feeds.bbci.co.uk/news/rss.xml'})).status,200);const news=await a.json('/api/news');assert.equal(news.items[0].title,'News & updates');assert.equal(news.items[1].url,'');
});
test('RSS blocks local/private network destinations',async t=>{
 const a=await app(t);await a.post('/api/settings',{newsEnabled:true,newsUrl:'http://127.0.0.1/feed'});const r=await a.request('/api/news');assert.equal(r.status,400);assert.match((await r.json()).error,/public/);
});
test('expired Microsoft credentials refresh automatically without losing the refresh token',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);const file=path.join(a.data,'tokens.json'),token=JSON.parse(await fs.readFile(file,'utf8'));token.expires=0;await fs.writeFile(file,JSON.stringify(token));await a.restart();assert.equal((await a.json(range)).events.length,2);
 const calls=(await fs.readFile(path.join(a.data,'provider-requests.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));assert.equal(calls.filter(x=>x.params.grant_type==='refresh_token').length,1);assert.equal(JSON.parse(await fs.readFile(file,'utf8')).refresh_token,'secret-ms-refresh');
});
test('expired Google credentials refresh after application restart',async t=>{
 const a=await app(t,{fake:true});await google(a);const file=path.join(a.data,'google-tokens.json'),token=JSON.parse(await fs.readFile(file,'utf8'));token.expires=0;await fs.writeFile(file,JSON.stringify(token));await a.restart();assert.equal((await a.json(range)).events.length,2);
 const calls=(await fs.readFile(path.join(a.data,'provider-requests.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));assert.equal(calls.find(x=>x.params.grant_type==='refresh_token').params.client_secret,'fake-google-secret');
});
test('Microsoft consent denial leaves the account disconnected',async t=>{
 const a=await app(t,{fake:true});await a.post('/api/settings',{microsoftClientId:'fake-ms-client'});await a.post('/api/calendar/microsoft/connect',{});await fs.writeFile(path.join(a.data,'provider-control.json'),JSON.stringify({denyMicrosoft:true}));const r=await a.post('/api/calendar/microsoft/poll',{});assert.equal(r.status,400);assert.match((await r.json()).error,/denied/);assert.equal((await a.json('/api/status')).providers.microsoft.connected,false);
});
test('provider outages retain cached appointments and explicitly report stale data',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);const expected=await a.json(range),file=path.join(a.data,'calendar.json'),cache=JSON.parse(await fs.readFile(file,'utf8'));Object.values(cache).forEach(x=>x.updated='2020-01-01T00:00:00Z');await fs.writeFile(file,JSON.stringify(cache));await fs.writeFile(path.join(a.data,'provider-control.json'),JSON.stringify({failMicrosoft:true}));await a.restart();const actual=await a.json(range);assert.equal(actual.stale,true);assert.deepEqual(actual.events,expected.events);assert.equal(actual.errors[0].provider,'microsoft');
});
test('calendar selections reach each provider event endpoint',async t=>{
 const a=await app(t,{fake:true});await microsoft(a);assert.equal((await a.json('/api/calendar/microsoft/list'))[0].id,'work');await a.post('/api/settings',{microsoftCalendarIds:['work']});assert.equal((await a.json(range)).events.length,2);const calls=(await fs.readFile(path.join(a.data,'provider-requests.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));assert.ok(calls.some(x=>x.url.endsWith('/calendars/work/calendarView')));
});
