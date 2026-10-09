import {jsonFetch} from './http.mjs';
import {readJSON,saveJSON} from './settings.mjs';
export class Weather {
 constructor(data,settings,secrets){this.data=data;this.settings=settings;this.secrets=secrets;this.cache={};this.pending=null;}
 async init(){this.cache=await readJSON(this.data,'weather.json',{});}
 key(){const key=this.secrets().weatherApiKey;if(!key)throw Error('Add an OpenWeather API key in settings.');return key;}
 async locations(q){if(!q||q.length>120)throw Error('Enter a city or postcode with country');const j=await jsonFetch('https://api.openweathermap.org/geo/1.0/direct?'+new URLSearchParams({q,limit:'5',appid:this.key()}));return j.map(x=>({name:[x.name,x.state,x.country].filter(Boolean).join(', '),lat:x.lat,lon:x.lon}));}
 async forecast(){const s=this.settings();if(!s.weatherEnabled)return {enabled:false};if(!s.weatherLocation)throw Error('Choose a weather location in settings.');const apiKey=this.key(),location=s.weatherLocation,key=JSON.stringify([location,s.weatherUnits,s.weatherApi]);const cached=this.cache[key];if(cached&&Date.now()-Date.parse(cached.updated)<600000)return cached;
  try{
   const endpoint=s.weatherApi==='4.0'?'https://api.openweathermap.org/data/4.0/onecall/timeline/1day':'https://api.openweathermap.org/data/3.0/onecall';
   const j=await jsonFetch(endpoint+'?'+new URLSearchParams({lat:String(location.lat),lon:String(location.lon),units:s.weatherUnits,appid:apiKey,...(s.weatherApi==='3.0'?{exclude:'current,minutely,hourly,alerts'}:{cnt:'7'})}));
   const raw=s.weatherApi==='4.0'?j.data:j.daily;if(!Array.isArray(raw)||raw.length<7)throw Error('OpenWeather did not return seven forecast days. Check One Call access.');
   const result={enabled:true,location:location.name,timezone:j.timezone||s.timezone,units:s.weatherUnits,updated:new Date().toISOString(),days:raw.slice(0,7).map(d=>({date:d.dt,min:d.temp.min,max:d.temp.max,rain:Math.round((d.pop||0)*100),wind:d.wind_speed,humidity:d.humidity,code:d.weather[0].id,description:d.weather[0].description}))};this.cache={[key]:result};await saveJSON(this.data,'weather.json',this.cache);return result;
  }catch(e){if(cached)return {...cached,stale:true,error:e.message};throw e;}
 }
}
