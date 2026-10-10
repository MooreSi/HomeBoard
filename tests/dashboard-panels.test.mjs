import test from 'node:test';
import assert from 'node:assert/strict';
import {familyHTML} from '../public/family-widgets.mjs';
test('Bin collections show ordinal month dates and a matching wheelie bin',()=>{
 const html=familyHTML('bins',{bins:[{title:'Brown bin',color:'#a07842',date:'2026-10-23',every:14,exceptions:[],reminderDays:1}],people:[]},'2026-10-10');
 assert.match(html,/23rd October/);assert.doesNotMatch(html,/2026-10-23/);assert.match(html,/<svg[^>]+class="wheelieBin"/);assert.match(html,/#a07842/);
});

import {collectionDate} from '../public/family-widgets.mjs';
import {newsSource} from '../public/news-source.mjs';
test('Ordinal collection dates handle teens, month boundaries and leap days',()=>{assert.deepEqual(['2026-10-01','2026-10-02','2026-10-03','2026-10-11','2026-10-12','2026-10-13','2026-10-21','2026-10-22','2024-02-29'].map(collectionDate),['1st October','2nd October','3rd October','11th October','12th October','13th October','21st October','22nd October','29th February']);});
test('Publisher branding recognizes CNN Google feed and rejects lookalike domains',()=>{assert.deepEqual(newsSource('https://news.google.com/rss/search?q=site%3Acnn.com%20when%3A7d'),{id:'cnn',name:'CNN'});assert.deepEqual(newsSource('https://feeds.bbci.co.uk.attacker.example/rss','Demo feed'),{id:'feed',name:'Demo feed'});});
