const value=x=>String(x?.val??x??'');
// Published calendars can keep STATUS:CONFIRMED and mark cancellation in the title.
export function isCancelled(event){return event.isCancelled===true||/^cancelled$|^canceled$/i.test(value(event.status).trim())||/\b(?:cancelled|canceled)\b/i.test(value(event.subject??event.summary));}
