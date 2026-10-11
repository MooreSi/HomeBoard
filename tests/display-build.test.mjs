import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
test('Dashboard HTML identifies its build and code assets are never reused without a fresh response',async t=>{
 const a=await app(t,{env:{HOMEBOARD_COMMIT:'demo-build-a'}});
 const response=await a.request('/');assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-homeboard-build'),'demo-build-a');const html=await response.text();assert.match(html,/<meta name="homeboard-build" content="demo-build-a">/);assert.match(html,/weather-panel\.css\?v=demo-build-a/);assert.match(html,/app\.js\?v=demo-build-a/);
 for(const path of ['/app.js?v=demo-build-a','/design.mjs','/style.css','/settings','/sw.js'])assert.equal((await a.request(path)).headers.get('cache-control'),'no-store',path);
});
test('An unstamped installation still exposes the same usable build identity in HTML and status',async t=>{
 const a=await app(t,{env:{HOMEBOARD_COMMIT:'unknown'}}),html=await(await a.request('/')).text(),system=await a.json('/api/system');assert.match(system.build,/^[a-f0-9]{40}$/);assert.equal(system.commit,'unknown');assert.ok(html.includes(`<meta name="homeboard-build" content="${system.build}">`));await a.restart();assert.equal((await a.json('/api/system')).build,system.build);
});
