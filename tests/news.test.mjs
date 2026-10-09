import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed} from '../lib/news.mjs';
test('Atom alternate links and encoded text become safe headline data',()=>{
 const r=parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><title>Family news</title><entry><title>One &amp; two</title><link rel="alternate" href="https://example.com/news"/><updated>2026-10-09T08:00:00Z</updated></entry></feed>');assert.deepEqual(r.items,[{title:'One & two',url:'https://example.com/news',date:'2026-10-09T08:00:00Z'}]);
});
test('entity definitions are rejected instead of fetching local files',()=>{
 assert.throws(()=>parseFeed('<!DOCTYPE rss [<!ENTITY file SYSTEM "file:///etc/passwd">]><rss><channel><title>&file;</title></channel></rss>'),/entity definitions/);
});
test('malformed XML fails visibly',()=>{
 assert.throws(()=>parseFeed('<rss><channel><title>Broken</channel>'),/invalid XML/);
});
