import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}),commit=/^[a-f0-9]{40}$/.test(git.stdout?.trim())?git.stdout.trim():'unknown';
const result=spawnSync('docker',['compose','build',...process.argv.slice(2)],{cwd:root,stdio:'inherit',env:{...process.env,HOMEBOARD_BUILD_COMMIT:commit}});
if(result.error)console.error(result.error.message);process.exitCode=result.status||Number(!!result.error);
