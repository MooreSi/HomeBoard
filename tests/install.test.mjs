import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('local installer binds on the LAN and plans a scoped firewall configuration',()=>{
 const r=spawnSync(process.execPath,['scripts/setup.mjs','local','--dry-run','--port','8099'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const p=JSON.parse(r.stdout);assert.equal(p.mode,'local');assert.equal(p.host,'0.0.0.0');assert.equal(p.port,8099);assert.equal(p.firewall,'local-subnets-only');
});
test('Docker installer mounts Apple photo sources read-only',()=>{
 const r=spawnSync(process.execPath,['scripts/setup.mjs','docker','--dry-run','--photos','/tmp/exported album'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const p=JSON.parse(r.stdout);assert.equal(p.photos,'/tmp/exported album');assert.equal(p.photoMount,'/apple-photos:ro');
});
test('installer rejects an invalid TCP port before performing setup',()=>{
 const r=spawnSync(process.execPath,['scripts/setup.mjs','local','--dry-run','--port','99999'],{encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stderr,/port/i);
});
test('Proxmox planner preserves the selected container ID and DHCP bridge',()=>{
 const r=spawnSync('bash',['scripts/install-lxc.sh','--id','120','--template','local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst','--bridge','vmbr1','--dry-run'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/LXC 120/);assert.match(r.stdout,/bridge vmbr1, DHCP/);
});
