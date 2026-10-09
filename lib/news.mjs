import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {publicText} from './public-http.mjs';
import {readJSON,saveJSON} from './settings.mjs';
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'',processEntities:true,parseTagValue:false});
const text=v=>String(typeof v==='object'?v?.['#text']||'':v||'').replace(/<[^>]*>/g,'').trim().slice(0,500);
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
export function parseFeed(xml){if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Feed document types and entity definitions are not supported');if(XMLValidator.validate(xml)!==true)throw Error('News feed contains invalid XML');const j=parser.parse(xml),rss=j.rss?.channel,atom=j.feed;if(!rss&&!atom)throw Error('This URL is not an RSS or Atom feed');
 return {title:text(rss?.title||atom?.title),items:array(rss?.item||atom?.entry).map(item=>{let link=rss?text(item.link):array(item.link).find(x=>!x.rel||x.rel==='alternate')?.href||'';try{const u=new URL(link);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)link='';}catch{link='';}return {title:text(item.title),url:link,date:text(item.pubDate||item.updated||item.published)};}).filter(x=>x.title)};
}
export class News {
 constructor(data,settings){this.data=data;this.settings=settings;this.cache={};}
 async init(){this.cache=await readJSON(this.data,'news.json',{});}
 async headlines(){const s=this.settings();if(!s.newsEnabled)return {enabled:false};if(!s.newsUrl)throw Error('Add an RSS or Atom URL in settings.');let cached=this.cache[s.newsUrl];if(cached&&Date.now()-Date.parse(cached.updated)<600000)return {...cached,items:cached.items.slice(0,s.newsLimit)};
  try{
   const xml=await publicText(s.newsUrl,{headers:{Accept:'application/rss+xml, application/atom+xml, application/xml, text/xml'}}),parsed=parseFeed(xml);
   cached={enabled:true,...parsed,items:parsed.items.slice(0,50),updated:new Date().toISOString()};this.cache={[s.newsUrl]:cached};await saveJSON(this.data,'news.json',this.cache);return {...cached,items:cached.items.slice(0,s.newsLimit)};
  }catch(e){if(cached)return {...cached,items:cached.items.slice(0,s.newsLimit),stale:true,error:e.message};throw e;}
 }
}
