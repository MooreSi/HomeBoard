import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),mode=args.shift();
const help='Usage: npm run setup -- local|docker [--port 8080] [--photos /absolute/folder] [--service] [--dry-run]\nFor Proxmox run bash scripts/install-lxc.sh on the Proxmox host.';
async function main(){
 if(!mode||mode==='--help'){console.log(help);return;}if(!['local','docker'].includes(mode))throw Error(help);
 let port=Number(process.env.DASHBOARD_PORT||8080),photos='',service=false,dry=false;
 while(args.length){const arg=args.shift();if(arg==='--port')port=Number(args.shift());else if(arg==='--photos')photos=args.shift()||'';else if(arg==='--service')service=true;else if(arg==='--dry-run')dry=true;else throw Error('Unknown option: '+arg);}
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Port must be between 1 and 65535');if(photos&&!path.isAbsolute(photos))throw Error('Photo path must be absolute');if(service&&(mode!=='local'||os.platform()!=='linux'))throw Error('--service requires local Linux with systemd');
 const plan={mode,host:'0.0.0.0',port,firewall:'local-subnets-only',photos:photos||null,photoMount:mode==='docker'?'/apple-photos:ro':null,service};if(dry){console.log(JSON.stringify(plan));return;}
 const run=(command,params,options={})=>{const r=spawnSync(command,params,{cwd:root,stdio:'inherit',...options});if(r.error||r.status!==0)throw Error(command+' failed. '+(r.error?.message||'Exit '+r.status));};
 const capture=(command,params)=>spawnSync(command,params,{encoding:'utf8'});
 const interfaces=Object.values(os.networkInterfaces()).flat().filter(x=>x&&!x.internal&&x.family==='IPv4');
 const subnets=[...new Set(interfaces.map(x=>{const parts=x.address.split('.').map(Number),mask=x.netmask.split('.').map(Number),network=parts.map((v,i)=>v&mask[i]).join('.'),bits=mask.map(v=>v.toString(2).split('1').length-1).reduce((a,b)=>a+b,0);return `${network}/${bits}`;}))];
 if(!interfaces.length)throw Error('No LAN IPv4 interface found. Connect this host to the network first.');
 if(photos&&!(await fs.stat(photos)).isDirectory())throw Error('Photo path is not a directory');
 await fs.mkdir(path.join(root,'data','apple-photos'),{recursive:true});
 const envFile=path.join(root,'.env');let env='';try{env=await fs.readFile(envFile,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
 function setEnv(key,value){if(/[\n\r"\\]/.test(value))throw Error('Unsupported character in configuration path');const line=`${key}="${value}"`;env=env.replace(new RegExp('^'+key+'=.*\\n?','m'),'');env+=(env&&!env.endsWith('\n')?'\n':'')+line+'\n';}
 setEnv('LAN_URLS',interfaces.map(x=>`http://${x.address}:${port}`).join(','));setEnv('DASHBOARD_PORT',String(port));setEnv('PORT',String(port));if(photos)setEnv(mode==='docker'?'APPLE_PHOTOS_DIR':'PHOTO_FOLDER',photos);await fs.writeFile(envFile,env,{mode:0o600});await fs.chmod(envFile,0o600);
 // Open only this application's listener on the host's connected LAN subnets.
 if(os.platform()==='darwin'&&mode==='local'){
  const firewall='/usr/libexec/ApplicationFirewall/socketfilterfw',state=capture(firewall,['--getglobalstate']);
  if(state.status===0&&state.stdout.includes('enabled')){run('sudo',[firewall,'--add',process.execPath]);run('sudo',[firewall,'--unblockapp',process.execPath]);}
 }else if(os.platform()==='linux'){
  const prefix=process.getuid?.()===0?[]:['sudo'];
  const command=(name,a)=>prefix.length?run(prefix[0],[name,...a]):run(name,a);
  const hasUfw=capture('which',['ufw']).status===0;const ufwStatus=hasUfw?capture(prefix.length?'sudo':'ufw',prefix.length?['ufw','status']:['status']):null;
  if(ufwStatus?.stdout?.includes('Status: active'))for(const subnet of subnets)command('ufw',['allow','from',subnet,'to','any','port',String(port),'proto','tcp']);
  else if(capture('firewall-cmd',['--state']).status===0){for(const subnet of subnets)command('firewall-cmd',['--permanent',`--add-rich-rule=rule family="ipv4" source address="${subnet}" port port="${port}" protocol="tcp" accept`]);command('firewall-cmd',['--reload']);}
 }
 function addresses(){console.log('\nOpen the dashboard on your home network:');for(const x of interfaces)console.log(`  http://${x.address}:${port}`);console.log(`  http://localhost:${port}\nSettings: /settings`);}
 const check=async()=>{for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${port}/api/status`,{signal:AbortSignal.timeout(1000)});if(r.ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw Error('Dashboard did not become ready. Check port conflicts and service/container logs.');};
 if(mode==='docker'){run('docker',['info','--format','{{.ServerVersion}}']);run('docker',['compose','up','--build','-d'],{env:{...process.env,DASHBOARD_PORT:String(port)}});await check();addresses();return;}
 if(Number(process.versions.node.split('.')[0])<22)throw Error('Install Node.js 22 or later');run(os.platform()==='win32'?'npm.cmd':'npm',['ci','--omit=dev']);
 if(service){if(process.getuid?.()!==0)throw Error('Run service installation as root (sudo node scripts/setup.mjs local --service)');
  run('systemctl',['--version']);const user='homeboard';if(capture('id',[user]).status!==0)run('useradd',['--system','--home-dir',root,'--shell','/usr/sbin/nologin',user]);run('chown',['-R',user+':'+user,path.join(root,'data')]);
  const escape=p=>'"'+p.replaceAll('\\','\\\\').replaceAll('"','\\"')+'"';
  const unit=`[Unit]\nDescription=HomeBoard family dashboard\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nUser=${user}\nWorkingDirectory=${escape(root)}\nEnvironment=HOST=0.0.0.0\nEnvironment=PORT=${port}\nEnvironment=DATA_DIR=${path.join(root,'data')}\nEnvironmentFile=${escape(envFile)}\nExecStart=${escape(process.execPath)} ${escape(path.join(root,'server.mjs'))}\nRestart=on-failure\nRestartSec=5\nNoNewPrivileges=true\nPrivateTmp=true\n\n[Install]\nWantedBy=multi-user.target\n`;
  await fs.writeFile('/etc/systemd/system/homeboard-dashboard.service',unit);run('systemctl',['daemon-reload']);run('systemctl',['enable','--now','homeboard-dashboard']);run('systemctl',['restart','homeboard-dashboard']);await check();addresses();return;
 }
 const child=spawn(process.execPath,['--env-file=.env','server.mjs'],{cwd:root,env:{...process.env,HOST:'0.0.0.0',PORT:String(port)},stdio:'inherit'});child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code||0;});process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));await check();addresses();console.log('Keep this terminal open. Press Ctrl+C to stop.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
