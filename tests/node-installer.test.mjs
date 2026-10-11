import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

// Mock the download/extraction and executable lookup boundaries. The real shell
// installer must make the extracted /usr/local/bin executable discoverable.
test('Node installer runs the extracted binary when the container PATH omits /usr/local/bin',()=>{
 const driver=String.raw`
installed=false
command() {
 if [ "$1" = -v ] && [ "$2" = node ]; then
  [ "$installed" = true ] && [[ ":$PATH:" == *":/usr/local/bin:"* ]]
 else builtin command "$@"; fi
}
node() {
 if [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then echo 'node: command not found' >&2; return 127; fi
 [ "$installed" = true ] || return 127
 echo v24.21.0
}
uname() { echo x86_64; }
curl() {
 local target=
 while [ "$#" -gt 0 ]; do
  if [ "$1" = -o ]; then target=$2; shift 2; else shift; fi
 done
 case "$target" in
  */SHASUMS256.txt) printf '%s\n' 'fixture-hash  node-v24.21.0-linux-x64.tar.xz' > "$target" ;;
  *) printf 'fixture archive' > "$target" ;;
 esac
}
sha256sum() { cat >/dev/null; echo 'node-v24.21.0-linux-x64.tar.xz: OK'; }
tar() { installed=true; }
source "$1"
`;
 const result=spawnSync('/bin/bash',['-c',driver,'node-installer-test',path.resolve('scripts/install-node.sh')],{env:{...process.env,PATH:'/usr/bin:/bin'},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 assert.match(result.stdout,/node-v24\.21\.0-linux-x64\.tar\.xz: OK/);
 assert.match(result.stdout,/v24\.21\.0/);
});
