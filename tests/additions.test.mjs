import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {app} from './helpers/app.mjs';
test('an Outlook published calendar connects without an Azure client ID and persists privately',async t=>{
 const a=await app(t,{fake:true});const r=await a.post('/api/settings',{calendarFeedUrl:'https://outlook.live.com/owa/calendar/test/calendar.ics'});assert.equal(r.status,200);
 assert.equal((await a.json('/api/settings')).calendarFeedConfigured,true);assert.equal((await a.json('/api/settings')).calendarFeedUrl,undefined);
 const events=await a.json('/api/events?start=2026-10-01T00:00:00Z&end=2026-11-01T00:00:00Z');assert.equal(events.demo,false);assert.equal(events.events.length,3);assert.equal(events.events[0].subject,'Family walk');assert.equal(events.events[2].isAllDay,true);
 await a.restart();assert.equal((await a.json('/api/settings')).calendarFeedConfigured,true);assert.equal((await fs.stat(path.join(a.data,'secrets.json'))).mode&0o777,0o600);
});
test('private calendar-feed network destinations are rejected',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{calendarFeedUrl:'http://127.0.0.1/calendar.ics'})).status,400);
});
test('iCloud shared-album URLs join the slideshow through a local read-only image route',async t=>{
 const a=await app(t,{fake:true});assert.equal((await a.post('/api/settings',{photoSource:'icloud',icloudAlbumUrl:'https://www.icloud.com/sharedalbum/#B00000000000000'})).status,200);
 const list=await a.json('/api/photos');assert.equal(list.length,1);assert.match(list[0],/^\/icloud-photos\/[a-f0-9]{64}$/);
 const image=await a.request(list[0]);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/jpeg');assert.deepEqual([...new Uint8Array(await image.arrayBuffer())],[255,216,255,217]);
 assert.equal((await a.post('/api/photos/delete',{url:list[0]})).status,400);assert.equal((await a.json('/api/settings')).icloudAlbumUrl,undefined);
});
test('iCloud album input rejects other hosts and requires a valid album identifier',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{icloudAlbumUrl:'https://evil.example/sharedalbum/#B00000000000000'})).status,400);assert.equal((await a.post('/api/settings',{icloudAlbumUrl:'https://www.icloud.com/sharedalbum/#bad'})).status,400);
});
test('both pages link a served HomeBoard favicon',async t=>{
 const a=await app(t);assert.match(await(await a.request('/')).text(),/rel="icon"[^>]+favicon.svg/);assert.match(await(await a.request('/settings')).text(),/rel="icon"[^>]+favicon.svg/);const r=await a.request('/favicon.svg');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/svg+xml');
});
test('six additional wall-display themes are selectable and retain the original themes',async t=>{
 const a=await app(t);const themes=await a.json('/api/themes');assert.equal(themes.length,17);assert.equal(new Set(themes.map(x=>x.id)).size,17);assert.ok(themes.some(x=>x.id==='tide'));assert.ok(themes.some(x=>x.id==='observatory'));assert.equal((await a.post('/api/settings',{theme:'tide',defaultView:'rolling'})).status,200);await a.restart();assert.equal((await a.json('/api/settings')).theme,'tide');assert.equal((await a.json('/api/settings')).defaultView,'rolling');
});
test('Microsoft reports a personal-account registration mismatch with actionable guidance',async t=>{
 const a=await app(t,{fake:true});await a.post('/api/settings',{microsoftClientId:'fake-ms-client'});await a.post('/api/calendar/microsoft/connect',{});await fs.writeFile(path.join(a.data,'provider-control.json'),JSON.stringify({wrongAudience:true}));const r=await a.post('/api/calendar/microsoft/poll',{});assert.equal(r.status,400);assert.match((await r.json()).error,/personal Microsoft accounts/);assert.equal((await a.json('/api/status')).providers.microsoft.connected,false);
});
test('removing a calendar link clears private credentials and returns to labelled demo state',async t=>{
 const a=await app(t,{fake:true});await a.post('/api/settings',{calendarFeedUrl:'https://outlook.live.com/owa/calendar/test/calendar.ics'});await a.json('/api/events?start=2026-10-01T00:00:00Z&end=2026-11-01T00:00:00Z');await a.post('/api/settings',{calendarFeedUrl:''});assert.equal((await a.json('/api/settings')).calendarFeedConfigured,false);assert.equal(JSON.parse(await fs.readFile(path.join(a.data,'secrets.json'),'utf8')).calendarFeedUrl,'');assert.deepEqual(JSON.parse(await fs.readFile(path.join(a.data,'calendar-feed.json'),'utf8')),{});assert.equal((await a.json('/api/events?start=2026-10-01T00:00:00Z&end=2026-11-01T00:00:00Z')).demo,true);
});
test('removing a shared-album link prevents previously issued image URLs from being served',async t=>{
 const a=await app(t,{fake:true});await a.post('/api/settings',{photoSource:'icloud',icloudAlbumUrl:'https://www.icloud.com/sharedalbum/#B00000000000000'});const [url]=await a.json('/api/photos');assert.equal((await a.request(url)).status,200);await a.post('/api/settings',{icloudAlbumUrl:''});assert.equal((await a.request(url)).status,404);assert.equal((await a.json('/api/settings')).icloudAlbumConfigured,false);
});
