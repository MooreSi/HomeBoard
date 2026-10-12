import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {command} from '../lib/managed-app.mjs';

async function failingGit(t,stderr) {
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'homeboard-git-error-'));
 t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 await fs.writeFile(path.join(dir,'git'),`#!${process.execPath}\nprocess.stderr.write(process.env.FIXTURE_GIT_STDERR);process.exit(128);\n`,{mode:0o755});
 return ()=>command('git',['ls-remote','https://github.com/MooreSi/HomeBoard.git','refs/heads/main'],{env:{...process.env,PATH:dir+path.delimiter+process.env.PATH,FIXTURE_GIT_STDERR:stderr}});
}
for(const [name,stderr,reason] of [
 ['DNS failure',"fatal: unable to access 'https://github.com/MooreSi/HomeBoard.git/': Could not resolve host: github.com",/cannot resolve GitHub/],
 ['certificate failure',"fatal: unable to access 'https://github.com/MooreSi/HomeBoard.git/': server certificate verification failed. CAfile: none CRLfile: none",/certificate/],
 ['repository ownership failure',"fatal: detected dubious ownership in repository at '/opt/homeboard'",/ownership/],
]) {
 test('update error explains '+name+' and states that the running version is retained',async t=>{
  const run=await failingGit(t,stderr);
  await assert.rejects(run,error=>{assert.match(error.message,reason);assert.match(error.message,/exit 128/);assert.match(error.message,/running version has been retained/);return true;});
 });
}
test('an unknown Git error gives a diagnostic instruction without exposing stderr credentials',async t=>{
 const run=await failingGit(t,'fatal: remote error https://fixture-user:fixture-password@example.test/private?token=fixture-secret');
 await assert.rejects(run,error=>{assert.match(error.message,/service user/);assert.equal(error.message.includes('fixture-secret'),false);assert.equal(error.message.includes('fixture-password'),false);return true;});
});
