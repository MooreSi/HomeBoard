import test from 'node:test';
import assert from 'node:assert/strict';
import * as display from '../public/display.mjs';
import {agendaHTML} from '../public/agenda.mjs';
test('Upcoming accepts the next date page and includes November appointments',()=>{
 const html=agendaHTML([{subject:'November visit',start:{dateTime:'2026-11-05T12:00:00Z'},end:{dateTime:'2026-11-05T13:00:00Z'}}],'2026-10-09',{timezone:'UTC',today:'2026-10-09',end:'2026-11-09'});
 assert.match(html,/November visit/);
});
test('Every calendar view advances through year and DST boundaries without stopping',()=>{
 assert.equal(typeof display.nextCalendarPage,'function','Calendar needs a next-page date operation');
 assert.equal(display.nextCalendarPage('2026-10-09','agenda'), '2026-10-23');
 assert.equal(display.nextCalendarPage('2026-12-01','month'), '2027-01-01');
 assert.equal(display.nextCalendarPage('2026-10-23','week'), '2026-10-30');
 assert.equal(display.nextCalendarPage('2026-10-23','rolling'), '2026-11-13');
 assert.equal(display.nextCalendarPage('2026-10-31','day'), '2026-11-01');
});
