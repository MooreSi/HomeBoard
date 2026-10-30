import {parts,stamp} from './display.mjs';
// Display titles: privacy masking, tidy birthdays and a keyword emoji.
// Earlier rows win, so specific activities sit above general travel words.
const emojiRules=[
 ['🏫',['school run']],['⚽',['football','soccer','futsal']],['🏉',['rugby']],['🏏',['cricket']],['🎾',['tennis','padel']],['🏸',['badminton']],['🏀',['basketball','netball']],['🏒',['hockey']],
 ['🏊',['swim','swimming','pool']],['🤸',['gymnastic','gym']],['🥋',['karate','judo','taekwondo','martial art']],['🩰',['ballet']],['💃',['dance','dancing']],['🏃',['run','running','parkrun','marathon']],['🚴',['cycling','bike']],['🧘',['yoga','pilates']],
 ['🎹',['piano']],['🎸',['guitar']],['🎻',['violin','cello']],['🥁',['drum']],['🎵',['music','choir','band practice']],['🎨',['art','painting']],['🎭',['theatre','theater','drama']],
 ['🦷',['dentist','dental','orthodontist']],['🩺',['doctor','gp','surgery appointment','clinic']],['🏥',['hospital']],['💉',['vaccination','vaccine','jab']],['👓',['optician','eye test']],['💇',['haircut','hairdresser','barber']],['🐾',['vet','vets']],
 ['🏫',['school','inset','parents evening']],['📚',['homework','exam','library','tuition']],['🎓',['graduation']],
 ['✈️',['flight','airport']],['🚆',['train']],['🏖️',['holiday','beach']],['🏕️',['camping']],['🧳',['trip']],
 ['🎉',['party']],['💍',['wedding','anniversary']],['🍽️',['dinner','lunch','brunch','restaurant']],['☕',['coffee']],['🎬',['cinema','movie']],
 ['🛒',['shopping','groceries']],['🧹',['cleaner','cleaning']],['🗑️',['bins','recycling']],['🔧',['plumber','electrician','mot']],['💼',['meeting','interview','work']],['📞',['call']],
].map(([emoji,words])=>[emoji,new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${words.map(w=>w.replace(/ /g,'\\s+')).join('|')})(?:s|es|ing)?(?![\\p{L}\\p{N}])`,'iu')]);
const birthdayRules=[/^(.+?)['’]s\s+birthday\b\s*\(?(\d{4})?\)?\s*$/iu,/^birthday\s*[:\-–]?\s+(.+?)\s*\(?(\d{4})?\)?\s*$/iu];
function eventDay(e,timezone){if(e.isAllDay)return String(e.start.dateTime||e.start.date).slice(0,10);const p=parts(stamp(e),timezone);return `${p.year}-${p.month}-${p.day}`;}
export function eventTitle(e,pref){
 if(pref.privacy||e.sensitivity==='private')return 'Private appointment';
 const subject=String(e.subject??'').trim();if(pref.eventEmoji===false||!subject)return subject;
 for(const rule of birthdayRules){const match=subject.match(rule);if(!match)continue;const year=Number(match[2]),age=Number(eventDay(e,pref.timezone).slice(0,4))-year;return `🎂 ${match[1].trim()}${match[2]&&age>=0?` (${age})`:''}`;}
 if(/^\p{Extended_Pictographic}/u.test(subject))return subject;
 const rule=emojiRules.find(([,pattern])=>pattern.test(subject));return rule?`${rule[0]} ${subject}`:subject;
}
