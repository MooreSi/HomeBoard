import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {once} from 'node:events';
import {readJSON,saveJSON} from './settings.mjs';
const execute=promisify(execFile),shaPattern=/^[a-f0-9]{40}$/;
export const sourceRepository='https://github.com/MooreSi/HomeBoard.git';
export async function command(name,args,options={}){
 try{return (await execute(name,args,{timeout:300000,maxBuffer:8*1024*1024,...options})).stdout.trim();}
 catch(e){throw Error(name+' failed'+(e.killed?' (timed out)':Number.isInteger(e.code)?' (exit '+e.code+')':'')+'. The running version has been retained.');}
}
export class ManagedApp {
 constructor({root,data,repository=sourceRepository,branch='main',env=process.env,log=(stream,value)=>process[stream].write(value),onFatal=()=>{},onUpdated=()=>{}}){
  this.root=path.resolve(root);this.data=path.resolve(data);this.repository=repository;this.branch=branch;this.env=env;this.log=log;this.onFatal=onFatal;this.onUpdated=onUpdated;
  this.updates=path.join(this.data,'updates');this.active=null;this.busy=false;this.stopping=new WeakSet();this.state={activeCommit:null};
  this.info={enabled:true,repository:sourceRepository.replace(/\.git$/,''),phase:'idle',available:false,currentCommit:null,latestCommit:null,error:null};
 }
 git(args,cwd=this.root){return command('git',args,{cwd,timeout:45000,env:{...this.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:os.devNull}});}
 async revision(root){try{const value=await this.git(['rev-parse','HEAD'],root);if(shaPattern.test(value))return value;}catch{}const metadata=await readJSON(root,'build-info.json',{});if(metadata.commit&&!shaPattern.test(metadata.commit))throw Error('Invalid build revision metadata');return metadata.commit||null;}
 snapshot(){return {...this.info};}
 progress(phase,extra={}){this.info={...this.info,phase,...extra};}
 async persist(){await saveJSON(this.updates,'state.json',this.state);}
 release(commit){if(!shaPattern.test(commit))throw Error('Invalid installed revision');return path.join(this.updates,'releases',commit);}
 async init(){
  await fs.mkdir(this.updates,{recursive:true,mode:0o700});await fs.mkdir(path.join(this.data,'photos'),{recursive:true});
  this.state=await readJSON(this.updates,'state.json',{activeCommit:null});
  if(this.state.pending){await this.restore(this.state.pending.backup);delete this.state.pending;await this.persist();}
  let activeRoot=this.root,current=await this.revision(this.root);
  if(!current&&shaPattern.test(this.env.HOMEBOARD_COMMIT||''))current=this.env.HOMEBOARD_COMMIT;
  if(Object.hasOwn(this.state,'baseCommit')&&this.state.baseCommit!==current)this.state.activeCommit=null;this.state.baseCommit=current;await this.persist();
  if(this.state.activeCommit){activeRoot=this.release(this.state.activeCommit);if(await this.revision(activeRoot)!==this.state.activeCommit)throw Error('Installed update files are incomplete. Re-run the installer using the preserved data directory.');current=this.state.activeCommit;}
  this.info.currentCommit=current;this.info.version=JSON.parse(await fs.readFile(path.join(activeRoot,'package.json'),'utf8')).version;
  this.info.phase=this.state.lastUpdate?.ok?'complete':'idle';this.info.error=this.state.lastUpdate?.error||null;
  this.active=await this.launch(activeRoot,current);return this.snapshot();
 }
 async launch(root,commit){
  const child=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:root,env:{...this.env,DATA_DIR:this.data,HOMEBOARD_MANAGED:'1',HOMEBOARD_COMMIT:commit||'unknown'},stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.on('data',value=>this.log('stdout',value));child.stderr.on('data',value=>this.log('stderr',value));
  child.on('message',message=>{if(message?.type==='updateRequest')this.respond(child,message);});
  child.on('exit',()=>{if(child===this.active?.child&&!this.stopping.has(child))this.onFatal(Error('Dashboard stopped unexpectedly.'));});
  let ready;try{ready=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(Error('New dashboard did not become ready within 20 seconds.')),20000),receive=m=>{if(m?.type==='ready')finish(null,m);},exit=()=>finish(Error('New dashboard failed to start.')),error=e=>finish(e);
   const finish=(e,result)=>{clearTimeout(timer);child.off('message',receive);child.off('exit',exit);child.off('error',error);e?reject(e):resolve(result);};child.on('message',receive);child.once('exit',exit);child.once('error',error);
  });const r=await fetch(`http://127.0.0.1:${ready.port}/api/system`,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('New dashboard health check failed.');const system=await r.json();if(commit&&system.commit!==commit)throw Error('New dashboard returned the wrong commit.');
  }catch(e){await this.stopChild(child);throw e;}
  return {child,root,commit,port:ready.port};
 }
 async respond(child,message){
  if(!['status','check','install'].includes(message.action))return;
  try{const result=message.action==='status'?this.snapshot():message.action==='check'?await this.check():this.beginUpdate();if(child.connected)child.send({type:'updateResponse',id:message.id,result});}
  catch(e){if(child.connected)child.send({type:'updateResponse',id:message.id,error:e.message});}
 }
 async check(){
  if(this.busy)return this.snapshot();this.busy=true;this.progress('checking',{error:null});
  try{await this.git(['--version']);const result=await this.git(['ls-remote',this.repository,'refs/heads/'+this.branch]);const match=result.match(/^([a-f0-9]{40})\s+refs\/heads\/[^\s]+$/);if(!match)throw Error('GitHub did not return a valid branch commit.');const latest=match[1];
   this.progress('idle',{enabled:true,reason:null,latestCommit:latest,available:latest!==this.info.currentCommit});
   if(!this.state.activeCommit&&await this.revision(this.root)){const dirty=await this.git(['status','--porcelain','--untracked-files=normal']);if(dirty)this.info={...this.info,enabled:false,reason:'Local source changes exist. Commit or move them before updating; no files will be overwritten.'};}
   return this.snapshot();
  }catch(e){this.progress('failed',{error:e.message});throw e;}finally{this.busy=false;}
 }
 beginUpdate(){if(this.busy)throw Error('An update operation is already running.');this.busy=true;this.progress('checking',{error:null});this.job=new Promise(resolve=>setImmediate(resolve)).then(()=>this.install()).finally(()=>{this.busy=false;});this.job.catch(()=>{});return this.snapshot();}
 async prepare(commit){
  const releases=path.join(this.updates,'releases');await fs.mkdir(releases,{recursive:true,mode:0o700});
  const stage=await fs.mkdtemp(path.join(this.updates,'.stage-'));
  try{this.progress('downloading');await this.git(['init',stage]);await this.git(['remote','add','origin',this.repository],stage);await this.git(['fetch','--depth=1','origin',commit],stage);await this.git(['checkout','--detach','FETCH_HEAD'],stage);if(await this.revision(stage)!==commit)throw Error('Downloaded commit does not match GitHub.');
   const pkg=JSON.parse(await fs.readFile(path.join(stage,'package.json'),'utf8'));if(pkg.name!=='homeboard'||typeof pkg.scripts?.verify!=='string')throw Error('Downloaded source is not a verified HomeBoard application.');const minimum=pkg.engines?.node?.match(/^>=([\d.]+)$/)?.[1];if(!minimum)throw Error('Updated Node requirement cannot be verified; run the installer.');const actual=process.versions.node.split('.').map(Number),required=minimum.split('.').map(Number);let comparison=0;for(let i=0;i<3;i++){if(actual[i]!==Number(required[i]||0)){comparison=actual[i]-Number(required[i]||0);break;}}if(comparison<0)throw Error('This update requires Node '+minimum+' or later. Upgrade the runtime with the installer first.');
   await fs.access(path.join(stage,'server.mjs'));await fs.access(path.join(stage,'scripts','runner.mjs'));await fs.access(path.join(stage,'scripts','manage.mjs'));
   this.progress('installing');await command(process.platform==='win32'?'npm.cmd':'npm',['ci','--omit=dev'],{cwd:stage,env:this.env});
   this.progress('verifying');await command(process.platform==='win32'?'npm.cmd':'npm',['run','verify'],{cwd:stage,env:{...this.env,MICROSOFT_CLIENT_ID:'',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',OPENWEATHER_API_KEY:''}});
   const destination=this.release(commit);try{await fs.access(destination);throw Error('This revision already has a staged installation. Restart or inspect it before retrying.');}catch(e){if(e.code!=='ENOENT')throw e;}await fs.rename(stage,destination);return {root:destination,version:pkg.version};
  }catch(e){await fs.rm(stage,{recursive:true,force:true});throw e;}
 }
 async backup(){const id=crypto.randomUUID(),dir=path.join(this.updates,'backups',id);await fs.mkdir(dir,{recursive:true,mode:0o700});for(const entry of await fs.readdir(this.data,{withFileTypes:true})){if(entry.isFile()&&/^[a-zA-Z0-9_-]+\.json$/.test(entry.name)){await fs.copyFile(path.join(this.data,entry.name),path.join(dir,entry.name));await fs.chmod(path.join(dir,entry.name),0o600);}}return id;}
 async restore(id){if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid update backup');const dir=path.join(this.updates,'backups',id),files=await fs.readdir(dir);for(const entry of await fs.readdir(this.data,{withFileTypes:true})){if(entry.isFile()&&/^[a-zA-Z0-9_-]+\.json$/.test(entry.name)&&!files.includes(entry.name))await fs.rm(path.join(this.data,entry.name));}for(const name of files){if(!/^[a-zA-Z0-9_-]+\.json$/.test(name))throw Error('Invalid backup file');await fs.copyFile(path.join(dir,name),path.join(this.data,name));await fs.chmod(path.join(this.data,name),0o600);}}
 async install(){let previous=this.active,previousCommit=this.state.activeCommit,backup=null,stopped=false,candidate;
  try{const result=await this.git(['ls-remote',this.repository,'refs/heads/'+this.branch]);const match=result.match(/^([a-f0-9]{40})\s+refs\/heads\/[^\s]+$/);if(!match)throw Error('GitHub did not return a valid branch commit.');const commit=match[1];this.info.latestCommit=commit;if(commit===this.info.currentCommit){this.progress('complete',{available:false});return;}
   if(!this.state.activeCommit&&await this.revision(this.root)&&await this.git(['status','--porcelain','--untracked-files=normal']))throw Error('Local source changes exist. Commit or move them before updating.');
   candidate=await this.prepare(commit);this.progress('restarting');await this.stopChild(previous.child);stopped=true;backup=await this.backup();this.state.pending={commit,backup};await this.persist();
   this.active=await this.launch(candidate.root,commit);this.state.activeCommit=commit;delete this.state.pending;this.state.lastUpdate={ok:true,at:new Date().toISOString()};await this.persist();this.progress('complete',{currentCommit:commit,version:candidate.version,available:false,error:null});this.onUpdated();
  }catch(e){if(stopped){if(this.active&&this.active!==previous)await this.stopChild(this.active.child);if(backup)await this.restore(backup);this.active=await this.launch(previous.root,previous.commit);this.state.activeCommit=previousCommit;delete this.state.pending;if(candidate&&candidate.root!==previous.root)await fs.rm(candidate.root,{recursive:true,force:true});}
   this.state.lastUpdate={ok:false,error:e.message,at:new Date().toISOString()};await this.persist();this.progress('failed',{error:e.message,available:this.info.latestCommit!==this.info.currentCommit});throw e;
  }
 }
 async stopChild(child){if(!child||child.exitCode!==null||child.signalCode!==null)return;this.stopping.add(child);const exited=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),5000);await exited;clearTimeout(timer);}
 async stop(){if(this.job)await this.job.catch(()=>{});await this.stopChild(this.active?.child);}
}
