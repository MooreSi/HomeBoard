import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
async function files(dir){return (await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(async d=>d.isDirectory()?files(path.join(dir,d.name)):/\.(mjs|js)$/.test(d.name)?[path.join(dir,d.name)]:[]))).flat();}
const targets=['server.mjs',...(await files('lib')),...(await files('public')),...(await files('tests')),...(await files('scripts')),'test.mjs'];
for(const file of targets){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`Syntax checked ${targets.length} JavaScript files.`);
