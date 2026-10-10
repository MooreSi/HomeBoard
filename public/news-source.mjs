const sources=[
 ['bbc','BBC News','feeds.bbci.co.uk'],['cnbc','CNBC','cnbc.com'],['cnn','CNN','cnn.com'],['fox','Fox News','foxnews.com'],['sky','Sky News','skynews.com'],['sky','Sky News','sky.com'],['gbnews','GB News','gbnews.com'],['guardian','The Guardian','theguardian.com'],['npr','NPR','npr.org'],['aljazeera','Al Jazeera','aljazeera.com']
];
export function newsSource(url,title='News'){
 let u;try{u=new URL(url);}catch{return {name:title,id:'feed'};}
 const source=sources.find(([id,,host])=>u.hostname===host||u.hostname.endsWith('.'+host)||id==='cnn'&&u.hostname==='news.google.com'&&/site:cnn\.com/.test(u.searchParams.get('q')||''));
 return source?{id:source[0],name:source[1]}:{id:'feed',name:title||u.hostname};
}
export function renderNewsSource(el,url,title){
 const source=newsSource(url,title);el.replaceChildren();el.title=source.name;el.setAttribute('aria-label',source.name);
 const img=document.createElement('img');img.src='/news-logos/'+source.id+(source.id==='feed'?'.svg':'.png');img.alt=source.name;el.append(img);
 const name=document.createElement('span');name.textContent=source.name;el.append(name);
}
