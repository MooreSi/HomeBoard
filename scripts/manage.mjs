import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ManagedApp} from '../lib/managed-app.mjs';
const root=process.env.HOMEBOARD_BASE_ROOT||fileURLToPath(new URL('../',import.meta.url)),data=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const manager=new ManagedApp({root,data,onFatal:error=>{console.error(error.message);process.exit(1);},onUpdated:()=>{if(process.send)process.send({type:'reloadManager'});}});
let closing=false;async function stop(){if(closing)return;closing=true;await manager.stop();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
try{await manager.init();}catch(e){console.error(e.message);process.exitCode=1;}
