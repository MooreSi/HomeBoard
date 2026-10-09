import {test} from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import {syncBuiltinESMExports} from 'node:module';
import {Agent,MockAgent} from 'undici';
import fs from 'node:fs/promises';
import os from 'node:os';
import {News} from '../lib/news.mjs';
test('RSS uses a compatible HTTP transport with the installed dispatcher',async t=>{
 const data=await fs.mkdtemp(os.tmpdir()+'/homeboard-transport-');t.after(()=>fs.rm(data,{recursive:true,force:true}));
 const mock=new MockAgent();mock.disableNetConnect();t.after(()=>mock.close());
 mock.get('https://feeds.bbci.co.uk').intercept({path:'/news/rss.xml'}).reply(200,'<?xml version="1.0"?><rss><channel><title>BBC News</title><item><title>Transport verified</title><link>https://www.bbc.co.uk/news/example</link></item></channel></rss>');
 t.mock.method(dns,'lookup',async()=>[{address:'151.101.0.81',family:4}]);syncBuiltinESMExports();t.after(syncBuiltinESMExports);
 t.mock.method(Agent.prototype,'dispatch',(options,handler)=>{assert.equal(typeof handler.onRequestStart,'function','HTTP handler must match the installed Undici dispatcher contract');return mock.get(String(options.origin)).dispatch(options,handler);});
 const n=new News(data,()=>({newsEnabled:true,newsUrl:'https://feeds.bbci.co.uk/news/rss.xml',newsLimit:5}));
 const r=await n.headlines();assert.equal(r.title,'BBC News');assert.equal(r.items[0].title,'Transport verified');mock.assertNoPendingInterceptors();
});
