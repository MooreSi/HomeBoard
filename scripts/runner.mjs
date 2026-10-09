// Small stable bootstrap: re-launches the update controller from the selected
// release after an update, so the controller itself also receives new code.
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
const root=fileURLToPath(new URL('../',import.meta.url)),data=path.resolve(process.env.DATA_DIR||path.join(root,'data')),execute=promisify(execFile);
let child,closing=false,reloading=false;
async function controller(){let source=root;let state;try{state=JSON.parse(await fs.readFile(path.join(data,'updates','state.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}let base=process.env.HOMEBOARD_COMMIT;try{base=(await execute('git',['rev-parse','HEAD'],{cwd:root})).stdout.trim();}catch{}if(!/^[a-f0-9]{40}$/.test(base||'')){try{base=JSON.parse(await fs.readFile(path.join(root,'build-info.json'),'utf8')).commit;}catch{}if(!/^[a-f0-9]{40}$/.test(base||''))base=null;}
 if(state?.activeCommit&&state.baseCommit===base&&/^[a-f0-9]{40}$/.test(state.activeCommit)&&!state.pending)source=path.join(data,'updates','releases',state.activeCommit);
 if(closing)return;
 const worker=spawn(process.execPath,[path.join(source,'scripts','manage.mjs')],{cwd:source,env:{...process.env,DATA_DIR:data,HOMEBOARD_BASE_ROOT:root},stdio:['ignore','inherit','inherit','ipc']});child=worker;
 worker.on('error',e=>{console.error(e.message);process.exit(1);});worker.on('message',message=>{if(message?.type==='reloadManager'&&!closing&&!reloading)reload().catch(e=>{console.error(e.message);process.exit(1);});});worker.on('exit',code=>{if(!closing&&!reloading){console.error('HomeBoard manager stopped.');process.exit(code||1);}});
}
async function terminate(){if(!child||child.exitCode!==null||child.signalCode!==null)return;const exited=once(child,'exit'),timer=setTimeout(()=>child.kill('SIGKILL'),10000);child.kill('SIGTERM');await exited;clearTimeout(timer);}
async function reload(){reloading=true;await terminate();await controller();reloading=false;}
async function stop(){if(closing)return;closing=true;await terminate();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
controller().catch(e=>{console.error(e.message);process.exitCode=1;});
