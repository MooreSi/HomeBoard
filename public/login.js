import {applyManagementAppearance} from './management.mjs';
import {api,post} from './display.mjs';
const $=id=>document.getElementById(id);let configured=true;
api('/api/auth/status').then(s=>{configured=s.configured;if(!configured){$('skipPassword').hidden=false;$('loginTitle').textContent='Optional password protection';$('loginHint').textContent='Continue without a password, or choose one of at least ten characters to protect editing.';$('confirmLabel').hidden=false;$('password').autocomplete='new-password';$('password').minLength=10;}}).catch(e=>$('loginStatus').textContent=e.message);
$('loginForm').onsubmit=async e=>{e.preventDefault();try{if(!configured&&$('password').value!==$('confirmPassword').value)throw Error('The passwords do not match');await post(configured?'/api/auth/login':'/api/auth/setup',{password:$('password').value});$('password').value='';const next=new URLSearchParams(location.search).get('next')||'/family';location.href=next.startsWith('/')&&!next.startsWith('//')?next:'/family';}catch(error){$('loginStatus').textContent=error.message;}};

api('/api/display-settings').then(s=>applyManagementAppearance(s.managementAppearance)).catch(()=>applyManagementAppearance());
