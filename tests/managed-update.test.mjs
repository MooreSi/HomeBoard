import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {managedFixture} from './helpers/managed.mjs';
test('checking compares the running commit with the remote branch without installing',async t=>{
 const f=await managedFixture(t);const r=await f.json('/api/update/check');assert.equal(r.currentCommit,f.oldCommit);assert.equal(r.latestCommit,f.latestCommit);assert.equal(r.available,true);assert.equal((await f.json('/api/system')).version,'0.1.0');
});
test('an update verifies the checkout, restarts it and preserves settings and installed revision',async t=>{
 const f=await managedFixture(t);assert.equal((await f.json('/api/update/install')).phase,'checking');await f.manager.job;
 assert.equal((await f.json('/api/system')).commit,f.latestCommit);assert.equal((await f.json('/api/system')).version,'0.2.0');assert.deepEqual(await f.json('/preferences'),{name:'Kept family'});assert.equal(f.manager.snapshot().phase,'complete');assert.equal(f.manager.snapshot().available,false);assert.equal(JSON.parse(await fs.readFile(path.join(f.data,'updates/state.json'),'utf8')).activeCommit,f.latestCommit);
});
test('verification failure leaves the old process and its settings untouched',async t=>{
 const f=await managedFixture(t,{failure:'verify'});const pid=f.manager.active.child.pid;f.manager.beginUpdate();await assert.rejects(f.manager.job,/npm failed/);assert.equal(f.manager.active.child.pid,pid);assert.equal((await f.json('/api/system')).commit,f.oldCommit);assert.deepEqual(await f.json('/preferences'),{name:'Kept family'});assert.equal(f.manager.snapshot().phase,'failed');
});
test('a boot failure rolls back both the executable and a partially migrated preferences file',async t=>{
 const f=await managedFixture(t,{failure:'boot'});f.manager.beginUpdate();await assert.rejects(f.manager.job,/failed to start/);assert.equal((await f.json('/api/system')).commit,f.oldCommit);assert.deepEqual(await f.json('/preferences'),{name:'Kept family'});assert.equal(JSON.parse(await fs.readFile(path.join(f.data,'updates/state.json'),'utf8')).activeCommit,null);assert.equal((await fs.stat(path.join(f.data,'settings.json'))).mode&0o777,0o600);
});
test('a duplicate update operation is rejected while the first one runs',async t=>{
 const f=await managedFixture(t);f.manager.beginUpdate();assert.throws(()=>f.manager.beginUpdate(),/already running/);await f.manager.job;assert.equal(f.manager.snapshot().currentCommit,f.latestCommit);
});
test('uncommitted source changes disable installation and are retained',async t=>{
 const f=await managedFixture(t);await fs.writeFile(path.join(f.root,'local-change.txt'),'Keep me');const r=await f.manager.check();assert.equal(r.enabled,false);assert.match(r.reason,/Local source changes/);f.manager.beginUpdate();await assert.rejects(f.manager.job,/Local source changes/);assert.equal(await fs.readFile(path.join(f.root,'local-change.txt'),'utf8'),'Keep me');assert.equal((await f.json('/api/system')).commit,f.oldCommit);
});
test('restarting the manager restores the installed revision rather than the original checkout',async t=>{
 const f=await managedFixture(t);f.manager.beginUpdate();await f.manager.job;await f.manager.stop();await f.manager.init();assert.equal((await f.json('/api/system')).commit,f.latestCommit);assert.equal(f.manager.snapshot().currentCommit,f.latestCommit);assert.deepEqual(await f.json('/preferences'),{name:'Kept family'});
});
test('a failed startup can be retried without leaving an unusable staged checkout',async t=>{
 const f=await managedFixture(t,{failure:'boot'});f.manager.beginUpdate();await assert.rejects(f.manager.job,/failed to start/);f.manager.beginUpdate();await assert.rejects(f.manager.job,/failed to start/);assert.equal((await f.json('/api/system')).commit,f.oldCommit);assert.deepEqual(await f.json('/preferences'),{name:'Kept family'});
});
test('a newly installed base checkout takes precedence over an older saved update pointer',async t=>{
 const f=await managedFixture(t);f.manager.beginUpdate();await f.manager.job;await f.manager.stop();await f.git(['fetch','origin',f.latestCommit],f.root);await f.git(['checkout','--detach',f.latestCommit],f.root);await f.manager.init();assert.equal(f.manager.active.root,f.root);assert.equal(f.manager.snapshot().currentCommit,f.latestCommit);assert.equal(JSON.parse(await fs.readFile(path.join(f.data,'updates/state.json'),'utf8')).activeCommit,null);
});
