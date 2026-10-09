import crypto from 'node:crypto';
import {jsonFetch} from './http.mjs';
import {readJSON,saveJSON} from './settings.mjs';
function basicDays(j){
 if(!Array.isArray(j.list)||!j.list.length)throw Error('OpenWeather returned no forecast intervals.');
 const offset=Number(j.city?.timezone)||0,groups=new Map();
 for(const row of j.list){const local=new Date((row.dt+offset)*1000),key=local.toISOString().slice(0,10);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
 const days=[...groups].sort(([a],[b])=>a.localeCompare(b)).slice(0,5).map(([key,rows])=>{const nearest=[...rows].sort((a,b)=>Math.abs(new Date((a.dt+offset)*1000).getUTCHours()-12)-Math.abs(new Date((b.dt+offset)*1000).getUTCHours()-12))[0];return {date:Date.parse(key+'T12:00:00Z')/1000-offset,min:Math.min(...rows.map(x=>x.main.temp_min)),max:Math.max(...rows.map(x=>x.main.temp_max)),rain:Math.round(Math.max(...rows.map(x=>x.pop||0))*100),wind:rows.reduce((n,x)=>n+x.wind.speed,0)/rows.length,humidity:nearest.main.humidity,code:nearest.weather[0].id,description:nearest.weather[0].description};});
 return {days,timezoneOffset:offset};
}
function weatherError(error,api){if(error.status===401||error.status===403)return Error(api==='basic'?'OpenWeather rejected the API key. Check it and allow a newly created key time to activate.':'One Call access was denied. Choose Automatic or Standard five-day forecast for a standard key, or enable the matching One Call subscription.');if(error.status===429)return Error('OpenWeather request limit reached. Try again later.');return error;}
export class Weather {
 constructor(data,settings,secrets){this.data=data;this.settings=settings;this.secrets=secrets;this.cache={};}
 async init(){this.cache=await readJSON(this.data,'weather.json',{});}
 key(){const key=this.secrets().weatherApiKey?.trim();if(!key)throw Error('Add an OpenWeather API key in settings.');return key;}
 async locations(q){if(!q?.trim()||q.length>120)throw Error('Enter a city or postcode with country');const key=this.key(),query=q.trim(),postcode=/^[A-Z]{1,2}\d[A-Z\d]?(?:\s*\d[A-Z]{2})?$/i.test(query)?query.toUpperCase()+',GB':/^\d{5}(?:-\d{4})?,\s*[A-Z]{2}$/i.test(query)?query.toUpperCase().replace(/,\s*/,','):null;let j;
  try{j=await jsonFetch('https://api.openweathermap.org/geo/1.0/'+(postcode?'zip?':'direct?')+new URLSearchParams(postcode?{zip:postcode,appid:key}:{q:query,limit:'5',appid:key}));}catch(e){throw weatherError(e,'basic');}
  return (postcode?[j]:j).map(x=>({name:[x.name,x.state,x.country].filter(Boolean).join(', '),lat:x.lat,lon:x.lon}));
 }
 async request(api,s,apiKey){const endpoint=api==='basic'?'/data/2.5/forecast':api==='4.0'?'/data/4.0/onecall/timeline/1day':'/data/3.0/onecall';const j=await jsonFetch('https://api.openweathermap.org'+endpoint+'?'+new URLSearchParams({lat:String(s.weatherLocation.lat),lon:String(s.weatherLocation.lon),units:s.weatherUnits,appid:apiKey,...(api==='3.0'?{exclude:'current,minutely,hourly,alerts'}:api==='4.0'?{cnt:'7'}:{})}));
  if(api==='basic')return {...basicDays(j),api,timezone:s.timezone};
  const raw=api==='4.0'?j.data:j.daily;if(!Array.isArray(raw)||raw.length<7)throw Error('OpenWeather did not return seven forecast days. Check One Call access.');
  return {api,timezone:j.timezone||s.timezone,days:raw.slice(0,7).map(d=>({date:d.dt,min:d.temp.min,max:d.temp.max,rain:Math.round((d.pop||0)*100),wind:d.wind_speed,humidity:d.humidity,code:d.weather[0].id,description:d.weather[0].description}))};
 }
 async forecast(){const s=this.settings();if(!s.weatherEnabled)return {enabled:false};if(!s.weatherLocation)throw Error('Start typing your town in Settings → Weather and select a suggested location.');const apiKey=this.key(),fingerprint=crypto.createHash('sha256').update(apiKey).digest('hex'),key=JSON.stringify([s.weatherLocation,s.weatherUnits,s.weatherApi,s.timezone,fingerprint]);const cached=this.cache[key];if(cached&&Date.now()-Date.parse(cached.updated)<600000)return cached;
  let api=s.weatherApi==='auto'?'4.0':s.weatherApi;
  try{let forecast;try{forecast=await this.request(api,s,apiKey);}catch(e){if(s.weatherApi==='auto'&&[401,403].includes(e.status)){api='basic';forecast=await this.request(api,s,apiKey);}else throw e;}
   const result={enabled:true,location:s.weatherLocation.name,units:s.weatherUnits,updated:new Date().toISOString(),...forecast};this.cache={[key]:result};await saveJSON(this.data,'weather.json',this.cache);return result;
  }catch(e){const error=weatherError(e,api);if(cached)return {...cached,stale:true,error:error.message};throw error;}
 }
}
