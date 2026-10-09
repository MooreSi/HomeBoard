import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {ManagedApp,command} from '../../lib/managed-app.mjs';
const channel=pathToFileURL(fileURLToPath(new URL('../../lib/update-channel.mjs',import.meta.url))).href;
export async function managedFixture(t,{failure=null}={}){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'homeboard managed '));let manager;t.after(async()=>{await manager?.stop();await fs.rm(dir,{recursive:true,force:true});});
 const repo=path.join(dir,'repository'),root=path.join(dir,'installed'),data=path.join(dir,'data');await fs.mkdir(repo);await fs.mkdir(data);await fs.writeFile(path.join(data,'settings.json'),JSON.stringify({name:'Kept family'}),{mode:0o600});
 const git=(args,cwd=repo)=>command('git',args,{cwd});await git(['init','--initial-branch=main']);
 async function write(version,problem){
  const pkg={name:'homeboard',version,type:'module',engines:{node:'>=22'},scripts:{verify:problem==='verify'?'node -e "process.exit(1)"':'node --check server.mjs'}};
  await fs.writeFile(path.join(repo,'package.json'),JSON.stringify(pkg));await fs.writeFile(path.join(repo,'package-lock.json'),JSON.stringify({name:'homeboard',version,lockfileVersion:3,packages:{'':{name:'homeboard',version}}}));await fs.mkdir(path.join(repo,'scripts'),{recursive:true});await fs.writeFile(path.join(repo,'scripts/runner.mjs'),'// Managed fixture entrypoint\n');await fs.writeFile(path.join(repo,'scripts/manage.mjs'),'// Managed fixture controller entrypoint\n');
  await fs.writeFile(path.join(repo,'server.mjs'),`import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import {updateRequest} from ${JSON.stringify(channel)};\n${problem==='boot'?"await fs.writeFile(path.join(process.env.DATA_DIR,'settings.json'),JSON.stringify({name:'Broken migration'}));throw Error('Fixture boot failure');":''}\nconst server=http.createServer(async(req,res)=>{try{const value=req.url==='/api/system'?{version:${JSON.stringify(version)},commit:process.env.HOMEBOARD_COMMIT}:req.url==='/api/update/status'?await updateRequest('status'):req.url==='/api/update/check'?await updateRequest('check'):req.url==='/api/update/install'?await updateRequest('install'):JSON.parse(await fs.readFile(path.join(process.env.DATA_DIR,'settings.json'),'utf8'));res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}});server.listen(Number(process.env.PORT),process.env.HOST,()=>{process.send({type:'ready',port:server.address().port});});`);
  await git(['add','.']);await git(['-c','user.name=HomeBoard Test','-c','user.email=fixture@example.test','commit','-m','Fixture '+version]);return git(['rev-parse','HEAD']);
 }
 const oldCommit=await write('0.1.0');await command('git',['clone',repo,root],{cwd:dir});const latestCommit=await write('0.2.0',failure);
 manager=new ManagedApp({root,data,repository:pathToFileURL(repo).href,env:{...process.env,HOST:'127.0.0.1',PORT:'0'},log:()=>{}});await manager.init();
 const json=async p=>(await fetch(`http://127.0.0.1:${manager.active.port}${p}`)).json();
 return {manager,root,data,oldCommit,latestCommit,json,git};
}
