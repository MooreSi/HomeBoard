import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSystemdUnit} from '../scripts/setup.mjs';

const options={root:'/opt/homeboard/',nodePath:'/usr/local/bin/node',port:8080,user:'homeboard',envFile:'/opt/homeboard/.env'};
test('service installer generates real line breaks and separate systemd unit sections',()=>{
 const unit=createSystemdUnit(options);
 assert.equal(unit.split('\n')[0],'[Unit]');
 assert.ok(unit.includes('\n[Service]\n'));
 assert.ok(unit.includes('\n[Install]\nWantedBy=multi-user.target\n'));
 assert.equal(unit.includes('\\n'),false);
 assert.ok(unit.includes('\nExecStart="/usr/local/bin/node" "/opt/homeboard/scripts/runner.mjs"\n'));
});
test('service installer quotes complete environment assignments when the application path contains spaces',()=>{
 const unit=createSystemdUnit({...options,root:'/opt/Home Board/',envFile:'/opt/Home Board/.env'});
 assert.ok(unit.includes('\nEnvironment="DATA_DIR=/opt/Home Board/data"\n'));
 assert.ok(unit.includes('\nEnvironmentFile=/opt/Home Board/.env\n'));
});

test('service installer emits absolute path directives without surrounding quote characters',()=>{
 const unit=createSystemdUnit(options);
 assert.equal(unit.split('\n').find(line=>line.startsWith('WorkingDirectory=')),'WorkingDirectory=/opt/homeboard/');
 assert.equal(unit.split('\n').find(line=>line.startsWith('EnvironmentFile=')),'EnvironmentFile=/opt/homeboard/.env');
});
