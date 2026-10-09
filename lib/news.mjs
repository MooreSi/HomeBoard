import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {Agent} from 'undici';
import {lookup} from 'node:dns/promises';
import {publicURL,isPublicAddress} from './http.mjs';
import {readJSON,saveJSON} from './settings.mjs';
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'',processEntities:true,parseTagValue:false});
const text=v=>String(typeof v==='object'?v?.['#text']||'':v||'').replace(/<[^>]*>/g,'').trim().slice(0,500);
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
export function parseFeed(xml){if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Feed document types and entity definitions are not supported');if(XMLValidator.validate(xml)!==true)throw Error('News feed contains invalid XML');const j=parser.parse(xml),rss=j.rss?.channel,atom=j.feed;if(!rss&&!atom)throw Error('This URL is not an RSS or Atom feed');
 return {title:text(rss?.title||atom?.title),items:array(rss?.item||atom?.entry).map(item=>{let link=rss?text(item.link):array(item.link).find(x=>!x.rel||x.rel==='alternate')?.href||'';try{const u=new URL(link);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)link='';}catch{link='';}return {title:text(item.title),url:link,date:text(item.pubDate||item.updated||item.published)};}).filter(x=>x.title)};
}
const dispatcher=new Agent({connect:{lookup(hostname,options,callback){lookup(hostname,{all:true}).then(records=>{if(!records.length||records.some(x=>!isPublicAddress(x.address)))throw Error('News feed must use a public internet address');if(options.all)callback(null,records);else callback(null,records[0].address,records[0].family);}).catch(callback);}}});
export class News {
 constructor(data,settings){this.data=data;this.settings=settings;this.cache={};}
 async init(){this.cache=await readJSON(this.data,'news.json',{});}
 async headlines(){const s=this.settings();if(!s.newsEnabled)return {enabled:false};if(!s.newsUrl)throw Error('Add an RSS or Atom URL in settings.');let cached=this.cache[s.newsUrl];if(cached&&Date.now()-Date.parse(cached.updated)<600000)return {...cached,items:cached.items.slice(0,s.newsLimit)};
  try{
   let url=await publicURL(s.newsUrl),r;
   for(let redirects=0;redirects<=4;redirects++){
    r=await fetch(url,{redirect:'manual',dispatcher,signal:AbortSignal.timeout(15000),headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml'}});
    if([301,302,303,307,308].includes(r.status)){await r.body?.cancel();url=await publicURL(new URL(r.headers.get('location'),url).href);continue;}break;
   }
   if(!r.ok)throw Error('News feed request failed ('+r.status+')');let bytes=0,chunks=[];for await(const chunk of r.body){bytes+=chunk.length;if(bytes>2*1024*1024)throw Error('News feed exceeds 2 MB');chunks.push(chunk);}const parsed=parseFeed(Buffer.concat(chunks).toString('utf8'));
   cached={enabled:true,...parsed,items:parsed.items.slice(0,50),updated:new Date().toISOString()};this.cache={[s.newsUrl]:cached};await saveJSON(this.data,'news.json',this.cache);return {...cached,items:cached.items.slice(0,s.newsLimit)};
  }catch(e){if(cached)return {...cached,items:cached.items.slice(0,s.newsLimit),stale:true,error:e.message};throw e;}
 }
}
