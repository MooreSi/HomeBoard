import {test} from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
test('legacy direct-server starts report why automatic restart is unavailable',async t=>{
 const a=await app(t);const r=await a.request('/api/update/status');assert.equal(r.status,200);const j=await r.json();assert.equal(j.enabled,false);assert.match(j.reason,/setup|managed/i);assert.equal(j.repository,'https://github.com/MooreSi/HomeBoard');
});
test('the update page exposes separate check and install actions',async t=>{
 const a=await app(t);const html=await(await a.request('/settings')).text();assert.match(html,/id="updateCheck"/);assert.match(html,/id="updateInstall"/);assert.match(html,/id="updateStatus"/);
});
test('software installation rejects cross-origin requests',async t=>{
 const a=await app(t);const r=await a.request('/api/update/install',{method:'POST',headers:{Origin:'http://evil.example','Content-Type':'application/json'},body:'{}'});assert.equal(r.status,403);
});
test('news is served inside a ticker with a pause control',async t=>{
 const a=await app(t);const html=await(await a.request('/')).text();assert.match(html,/class="tickerViewport"/);assert.match(html,/id="tickerPause"/);assert.match(html,/id="tickerTrack"/);
});
