import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {app} from './helpers/app.mjs';

test('settings has a separate page and dashboard has no upload picker',async t=>{
 const a=await app(t);const response=await a.request('/settings');assert.equal(response.status,200);
 const home=await(await a.request('/')).text();assert.doesNotMatch(home,/type=["']file["']|<dialog/);
 assert.match(await response.text(),/Calendar connections/);
});
test('shared display preferences persist after restart',async t=>{
 const a=await app(t);const r=await a.post('/api/settings',{name:'Family',theme:'midnight',timezone:'America/New_York',dateFormat:'iso',clock:'analog',photoInterval:45,photoTransition:'slide',photoOrder:'shuffle'});
 assert.equal(r.status,200);await a.restart();const s=await a.json('/api/settings');
 assert.equal(s.name,'Family');assert.equal(s.timezone,'America/New_York');assert.equal(s.photoInterval,45);assert.equal(s.clock,'analog');assert.equal(s.photoTransition,'slide');assert.equal(s.theme,'midnight');
 assert.equal(JSON.parse(await fs.readFile(path.join(a.data,'settings.json'),'utf8')).photoOrder,'shuffle');
});
test('invalid timezone rejects the entire preferences update',async t=>{
 const a=await app(t);const r=await a.post('/api/settings',{timezone:'Invented/Place',name:'Rejected'});assert.equal(r.status,400);
 assert.notEqual((await a.json('/api/settings')).name,'Rejected');
});
test('slideshow timer rejects zero instead of silently accepting it',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{photoInterval:0})).status,400);
});
test('seventeen distinct researched themes retain the ten original choices',async t=>{
 const a=await app(t);const r=await a.request('/api/themes');assert.equal(r.status,200);const themes=await r.json();assert.equal(themes.length,17);assert.equal(new Set(themes.map(x=>x.id)).size,17);assert.deepEqual(themes.slice(0,10).map(x=>x.id),['homeboard','midnight','chalkboard','coastal','forest','sunset','minimal','lavender','aurora','gallery']);
});
test('Showcase theme is listed, styled and persists after restart',async t=>{
 const a=await app(t);const themes=await a.json('/api/themes');const showcase=themes.find(x=>x.id==='showcase');
 assert.deepEqual(showcase,{id:'showcase',name:'Showcase',description:'Midnight navy glass with a cyan-to-blue glow, as on the HomeBoard poster',layout:'showcase',colors:['#0b1424','#2fc4f2','#16233a']});
 const css=await(await a.request('/style.css')).text();assert.match(css,/body\[data-theme=showcase\]\{--bg:#0b1424;/);
 assert.equal((await a.post('/api/settings',{theme:'showcase'})).status,200);await a.restart();assert.equal((await a.json('/api/settings')).theme,'showcase');
});
test('API secrets are stored privately and omitted from settings responses',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{googleClientSecret:'test-secret',weatherApiKey:'test-weather'})).status,200);
 const r=await(await a.request('/api/settings')).text();assert.doesNotMatch(r,/test-secret|test-weather/);assert.equal(JSON.parse(r).weatherKeyConfigured,true);
 assert.equal((await fs.stat(path.join(a.data,'secrets.json'))).mode&0o777,0o600);
});
test('disabled weather and news have explicit disabled responses',async t=>{
 const a=await app(t);assert.deepEqual(await a.json('/api/weather'),{enabled:false});assert.deepEqual(await a.json('/api/news'),{enabled:false});
});
test('Apple folder photos are read-only and source removal updates the list',async t=>{
 const a=await app(t);const folder=path.join(a.data,'apple-export');await fs.mkdir(folder);await fs.writeFile(path.join(folder,'memory.jpg'),Buffer.from([255,216,255,217]));
 assert.equal((await a.post('/api/settings',{photoFolder:folder,photoSource:'folder'})).status,200);
 const list=await a.json('/api/photos');assert.equal(list.length,1);assert.match(list[0],/^\/folder-photos\//);assert.equal((await a.request(list[0])).status,200);
 assert.equal((await a.post('/api/photos/delete',{url:list[0]})).status,400);assert.equal((await fs.stat(path.join(folder,'memory.jpg'))).size,4);
 await fs.rm(path.join(folder,'memory.jpg'));assert.deepEqual(await a.json('/api/photos'),[]);
});
test('Apple folder refuses symbolic links to files outside the source',async t=>{
 const a=await app(t);const folder=path.join(a.data,'folder');await fs.mkdir(folder);await fs.writeFile(path.join(a.data,'outside.jpg'),Buffer.from([255,216,255,217]));await fs.symlink(path.join(a.data,'outside.jpg'),path.join(folder,'leak.jpg'));
 assert.equal((await a.post('/api/settings',{photoFolder:folder,photoSource:'folder'})).status,200);assert.deepEqual(await a.json('/api/photos'),[]);
 // Negative control: adding a real image proves enumeration is not blind.
 await fs.writeFile(path.join(folder,'real.jpg'),Buffer.from([255,216,255,217]));assert.equal((await a.json('/api/photos')).length,1);
});
test('reported LAN addresses use installer-supplied host addresses instead of container IPs',async t=>{
 const a=await app(t,{env:{LAN_URLS:'http://192.168.0.53:8080,http://192.168.5.2:8080'}});const s=await a.json('/api/system');assert.ok(s.urls.includes('http://192.168.0.53:8080'));assert.ok(s.urls.includes('http://192.168.5.2:8080'));
});
test('HomeBoard branding appears on the dashboard and settings page',async t=>{
 const a=await app(t);assert.match(await(await a.request('/')).text(),/<title>HomeBoard ·/);assert.match(await(await a.request('/settings')).text(),/<title>HomeBoard ·/);
});
test('a retired theme identifier migrates to the HomeBoard default on startup',async t=>{
 const a=await app(t);await fs.writeFile(path.join(a.data,'settings.json'),JSON.stringify({theme:'retired-default',name:'Family'}));await a.restart();const s=await a.json('/api/settings');assert.equal(s.theme,'homeboard');assert.equal(s.name,'Family');assert.equal(JSON.parse(await fs.readFile(path.join(a.data,'settings.json'),'utf8')).theme,'homeboard');
});
