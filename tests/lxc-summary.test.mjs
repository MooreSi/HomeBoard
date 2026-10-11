import {test} from 'node:test';
import assert from 'node:assert/strict';
import {formatLxcSummary} from '../scripts/lxc-summary.mjs';

test('LXC completion shows the guest IPv4 address and selected port as a dashboard URL',()=>{
 const interfaces={lo:[{address:'127.0.0.1',family:'IPv4',internal:true}],eth0:[{address:'192.168.1.100',family:'IPv4',internal:false},{address:'fe80::1234',family:'IPv6',internal:false}]};
 assert.equal(formatLxcSummary('100','8099',interfaces),'\nHomeBoard installation complete (LXC 100).\n\nOpen your dashboard:\n  http://192.168.1.100:8099\n\n');
});
test('LXC completion excludes loopback and link-local addresses and lists every usable IPv4 address once',()=>{
 const interfaces={lo:[{address:'127.0.0.1',family:'IPv4',internal:true}],eth0:[{address:'169.254.1.2',family:'IPv4',internal:false},{address:'10.0.0.100',family:'IPv4',internal:false},{address:'10.0.0.100',family:'IPv4',internal:false}],eth1:[{address:'192.168.2.100',family:'IPv4',internal:false}]};
 assert.equal(formatLxcSummary('100','8080',interfaces),'\nHomeBoard installation complete (LXC 100).\n\nOpen your dashboard:\n  http://10.0.0.100:8080\n  http://192.168.2.100:8080\n\n');
});
test('LXC completion gives a DHCP inspection command if no usable address is available',()=>{
 assert.equal(formatLxcSummary('120','8080',{}),'\nHomeBoard installation complete (LXC 120).\n\nNo dashboard IPv4 address detected. Check DHCP with:\n  pct exec 120 -- ip -4 addr show\n\n');
});
