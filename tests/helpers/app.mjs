import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export async function app(t,{fake=false,env={}}={}) {
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'homeboard-test-'));
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));
  const port=probe.address().port;await new Promise(r=>probe.close(r));
  let child,exited;
  async function start(){
    child=spawn(process.execPath,[...(fake?['--import',path.join(root,'tests/helpers/providers.mjs')]:[]),path.join(root,'server.mjs')],{env:{...process.env,PORT:String(port),DATA_DIR:data,MICROSOFT_CLIENT_ID:'',GOOGLE_CLIENT_ID:'',GOOGLE_CLIENT_SECRET:'',OPENWEATHER_API_KEY:'',...env},stdio:['ignore','pipe','pipe']});
    exited=once(child,'exit');
    let err='';child.stderr.on('data',c=>err+=c);
    await Promise.race([once(child.stdout,'data'),exited.then(()=>{throw Error('Startup failed: '+err)})]);
  }
  async function stop(){child.kill();await exited;}
  t.after(async()=>{await stop();await fs.rm(data,{recursive:true,force:true});});
  await start();
  const base=`http://127.0.0.1:${port}`;
  return {data,base,request:(p,options)=>fetch(base+p,options),json:async(p,options)=>(await fetch(base+p,options)).json(),post:(p,v)=>fetch(base+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)}),restart:async()=>{await stop();await start();}};
}
