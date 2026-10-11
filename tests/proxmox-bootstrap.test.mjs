import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function run(t, scenario = 'normal', args = ['--dry-run']) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'homeboard-bootstrap-test-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const fakeInstaller = `printf '%s\\n' "$@" > "$INSTALL_ARGS"
echo 'http://192.168.1.137:8080'
`;
 const fake=`#!${process.execPath}
import fs from 'node:fs';
import path from 'node:path';
const cmd=path.basename(process.argv[1]), args=process.argv.slice(2);
fs.appendFileSync(process.env.CALLS, JSON.stringify([cmd,...args])+'\\n');
const scenario=process.env.SCENARIO;
if(cmd==='id') console.log(scenario==='nonroot'?'1000':'0');
else if(cmd==='uname') console.log(scenario==='arm'?'aarch64':'x86_64');
else if(cmd==='pvesh') console.log('137');
else if(cmd==='pvesm') console.log('Name Type Status Total Used Available %\\n'+(scenario==='no-storage'?'': args.includes('rootdir')?'small dir active 9000000 8999999 1 99%\\ntank zfspool active 99999999 1 99999998 0%\\noffline dir inactive 999999999 0 999999999 0%':'templates dir active 5000000 1 4999999 0%'));
else if(cmd==='ip') console.log(scenario==='no-bridge'?'':'4: vmbr1: <BROADCAST,UP> mtu 1500\\n3: vmbr0: <BROADCAST,UP> mtu 1500');
else if(cmd==='pveam' && args[0]==='available') console.log(scenario==='no-template'?'system ubuntu-24.04-standard_24.04-2_amd64.tar.zst':'system debian-12-standard_12.12-1_amd64.tar.zst');
else if(cmd==='sh') console.log(scenario==='unsupported-debian'?'unknown':'trixie');
else if(cmd==='apt-get') {
 if(scenario==='apt-failure') process.exit(42);
 const setting=key=>args.find(x=>x.startsWith(key+'='))?.slice(key.length+1);
 const source=setting('Dir::Etc::sourcelist');
 if(scenario==='broken-host-repos' && !source) {console.error('enterprise: 401 Unauthorized; Coral: 403 Forbidden');process.exit(100);}
 if(source) fs.appendFileSync(process.env.APT_CONFIGS,JSON.stringify({source,contents:fs.readFileSync(source,'utf8'),parts:setting('Dir::Etc::sourceparts'),lists:setting('Dir::State::lists')})+'\\n');
}
else if(cmd==='pveam' && ['update','download'].includes(args[0])) {}
else if(cmd==='git' && args[0]==='clone') {
 const dest=args.at(-1); fs.mkdirSync(path.join(dest,'scripts'),{recursive:true});
 fs.writeFileSync(path.join(dest,'scripts/install-lxc.sh'), ${JSON.stringify(fakeInstaller)});
}
else { console.error('Unexpected mutation: '+cmd); process.exit(90); }
`;
 for(const name of ['id','uname','pct','pvesm','pveam','pvesh','ip','apt-get','git','sh']) fs.writeFileSync(path.join(dir,name),fake,{mode:0o755});
 const calls=path.join(dir,'calls'), installArgs=path.join(dir,'install-args'), aptConfigs=path.join(dir,'apt-configs');
 const result=spawnSync('/bin/bash',['scripts/bootstrap-proxmox.sh',...args],{encoding:'utf8',env:{...process.env,PATH:dir+':'+process.env.PATH,SCENARIO:scenario,CALLS:calls,INSTALL_ARGS:installArgs,APT_CONFIGS:aptConfigs}});
 return {...result,aptConfigs:fs.existsSync(aptConfigs)?fs.readFileSync(aptConfigs,'utf8').trim().split('\n').map(JSON.parse):[],installArgs:fs.existsSync(installArgs)?fs.readFileSync(installArgs,'utf8').trim().split('\n'):[],calls:fs.existsSync(calls)?fs.readFileSync(calls,'utf8').trim().split('\n').map(JSON.parse):[]};
}
test('Proxmox bootstrap automatically selects free ID, supported storage, bridge and template without mutations in dry run', t=>{
 const r=run(t); assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/LXC 137/); assert.match(r.stdout,/storage tank/); assert.match(r.stdout,/bridge vmbr0/);
 assert.match(r.stdout,/templates:vztmpl\/debian-12-standard_12.12-1_amd64.tar.zst/);
 assert.equal(r.calls.some(c=>['apt-get','git'].includes(c[0]) || c[0]==='pveam' && ['update','download'].includes(c[1])),false);
});
for(const [scenario,error] of [['nonroot',/root on the Proxmox host/],['arm',/x86_64 Proxmox host/],['no-storage',/active storage/],['no-bridge',/network bridge/],['no-template',/Debian 12 template/]]) {
 test('Proxmox bootstrap rejects '+scenario+' before creating a container',t=>{
  const r=run(t,scenario); assert.notEqual(r.status,0); assert.match(r.stderr,error);
  assert.equal(r.calls.some(c=>c[0]==='pct'),false);
 });
}
test('Proxmox bootstrap rejects unknown options',t=>{
 const r=run(t,'normal',['--unknown']); assert.notEqual(r.status,0); assert.match(r.stderr,/Unknown option/); assert.deepEqual(r.calls,[]);
});

test('Proxmox bootstrap installs dependencies, downloads the selected template and forwards automatic options to the installer',t=>{
 const r=run(t,'normal',[]); assert.equal(r.status,0,r.stderr);
 assert.equal(r.aptConfigs.length,2);
 const work=path.dirname(r.aptConfigs[0].source);
 const options=['-o','Dir::Etc::sourcelist='+path.join(work,'debian.list'),'-o','Dir::Etc::sourceparts='+path.join(work,'sources.list.d'),'-o','Dir::State::lists='+path.join(work,'lists'),'-o','Dir::Cache::pkgcache=','-o','Dir::Cache::srcpkgcache=','-o','APT::Update::Error-Mode=any'];
 assert.deepEqual(r.calls.filter(c=>c[0]==='apt-get'),[['apt-get',...options,'update'],['apt-get',...options,'install','-y','git','ca-certificates']]);
 assert.deepEqual(r.calls.filter(c=>c[0]==='pveam' && c[1]==='download'),[['pveam','download','templates','debian-12-standard_12.12-1_amd64.tar.zst']]);
 assert.deepEqual(r.installArgs,['--id','137','--template','templates:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst','--storage','tank','--bridge','vmbr0','--port','8080']);
 assert.match(r.stdout,/http:\/\/192\.168\.1\.137:8080/);
 const clone=r.calls.find(c=>c[0]==='git'); assert.equal(fs.existsSync(path.dirname(clone.at(-1))),false);
});
test('Proxmox bootstrap stops after a dependency installation failure without cloning or creating a guest',t=>{
 const r=run(t,'apt-failure',[]); assert.equal(r.status,42); assert.match(r.stderr,/installation stopped/);
 assert.equal(r.calls.some(c=>['git','pct'].includes(c[0]) || c[0]==='pveam'),false);
 assert.deepEqual(r.installArgs,[]);
});

test('Proxmox bootstrap installs tools despite unrelated enterprise and Coral repository failures using isolated signed Debian sources',t=>{
 const r=run(t,'broken-host-repos',[]); assert.equal(r.status,0,r.stderr);
 assert.equal(r.aptConfigs.length,2);
 for(const config of r.aptConfigs) {
  assert.match(config.source,/^\/tmp\/homeboard-install\.[^/]+\/debian\.list$/);
  assert.equal(config.parts,path.join(path.dirname(config.source),'sources.list.d'));
  assert.equal(config.lists,path.join(path.dirname(config.source),'lists'));
  assert.equal(config.contents,'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian trixie main\n'+'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://deb.debian.org/debian trixie-updates main\n'+'deb [signed-by=/usr/share/keyrings/debian-archive-keyring.gpg] http://security.debian.org/debian-security trixie-security main\n');
  assert.equal(fs.existsSync(path.dirname(config.source)),false);
 }
 assert.match(r.stdout,/http:\/\/192\.168\.1\.137:8080/);
 assert.deepEqual(r.installArgs,['--id','137','--template','templates:vztmpl/debian-12-standard_12.12-1_amd64.tar.zst','--storage','tank','--bridge','vmbr0','--port','8080']);
});

test('Proxmox bootstrap rejects an unknown host release before installing packages or creating a guest',t=>{
 const r=run(t,'unsupported-debian',[]); assert.equal(r.status,1); assert.match(r.stderr,/Unsupported Debian release: unknown/);
 assert.equal(r.calls.some(c=>['apt-get','git','pct'].includes(c[0]) || c[0]==='pveam'),false);
});
