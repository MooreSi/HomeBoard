import {test} from 'node:test';import assert from 'node:assert/strict';import {app} from './helpers/app.mjs';
test('news presets include requested sources and retain a custom feed option',async t=>{
 const a=await app(t);const r=await a.request('/api/news/feeds');assert.equal(r.status,200);const feeds=await r.json();assert.deepEqual(feeds.filter(x=>['bbc','cnbc','cnn','fox','sky','gbnews'].includes(x.id)).map(x=>x.id),['bbc','cnbc','cnn','fox','sky','gbnews']);assert.equal(feeds.find(x=>x.id==='bbc').url,'https://feeds.bbci.co.uk/news/rss.xml');assert.equal(feeds.find(x=>x.id==='cnn').name,'CNN · via Google News');const html=await(await a.request('/settings')).text();assert.match(html,/id="newsPreset"/);assert.match(html,/Custom RSS/);
});
test('Calendar Link settings need no account sign-in controls',async t=>{
 const a=await app(t);const html=await(await a.request('/settings')).text();assert.match(html,/<h3>Calendar Link<\/h3>/);assert.match(html,/No Microsoft or Google sign-in/);
 const loginControls=source=>/id="(?:microsoftConnect|googleConnect|microsoftClientId|googleClientId)"/.test(source);assert.equal(loginControls('<button id="microsoftConnect">Connect</button>'),true);assert.equal(loginControls(html),false);
});
test('weather location supports suggestions and offers automatic/basic forecasts',async t=>{
 const a=await app(t);const html=await(await a.request('/settings')).text();assert.match(html,/id="locationQuery"[^>]*role="combobox"/);assert.match(html,/id="locationResults"[^>]*role="listbox"/);assert.match(html,/option value="auto"/);assert.match(html,/option value="basic"/);
});
test('Apple-style webcal subscription links are stored as HTTPS without account credentials',async t=>{
 const a=await app(t,{fake:true});const r=await a.post('/api/settings',{calendarFeedUrl:'webcal://outlook.live.com/calendar.ics'});assert.equal(r.status,200);assert.equal((await r.json()).calendarFeedConfigured,true);const fs=await import('node:fs/promises'),path=await import('node:path');assert.equal(JSON.parse(await fs.readFile(path.join(a.data,'secrets.json'),'utf8')).calendarFeedUrl,'https://outlook.live.com/calendar.ics');
});
