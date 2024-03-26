import{invoke as n}from"@tauri-apps/api/core";
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */function t(n,t,r,e){return new(r||(r=Promise))((function(i,o){function u(n){try{a(e.next(n))}catch(n){o(n)}}function c(n){try{a(e.throw(n))}catch(n){o(n)}}function a(n){var t;n.done?i(n.value):(t=n.value,t instanceof r?t:new r((function(n){n(t)}))).then(u,c)}a((e=e.apply(n,t||[])).next())}))}function r(n,t){var r,e,i,o,u={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function c(o){return function(c){return function(o){if(r)throw new TypeError("Generator is already executing.");for(;u;)try{if(r=1,e&&(i=2&o[0]?e.return:o[0]?e.throw||((i=e.return)&&i.call(e),0):e.next)&&!(i=i.call(e,o[1])).done)return i;switch(e=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return u.label++,{value:o[1],done:!1};case 5:u.label++,e=o[1],o=[0];continue;case 7:o=u.ops.pop(),u.trys.pop();continue;default:if(!(i=u.trys,(i=i.length>0&&i[i.length-1])||6!==o[0]&&2!==o[0])){u=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){u.label=o[1];break}if(6===o[0]&&u.label<i[1]){u.label=i[1],i=o;break}if(i&&u.label<i[2]){u.label=i[2],u.ops.push(o);break}i[2]&&u.ops.pop(),u.trys.pop();continue}o=t.call(n,u)}catch(n){o=[6,n],e=0}finally{r=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,c])}}}function e(e){return t(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return[4,n("plugin:tracing|info",{str:e})];case 1:return t.sent(),[2]}}))}))}function i(e){return t(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return[4,n("plugin:tracing|trace",{str:e})];case 1:return t.sent(),[2]}}))}))}function o(e){return t(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return[4,n("plugin:tracing|warn",{str:e})];case 1:return t.sent(),[2]}}))}))}function u(e){return t(this,void 0,void 0,(function(){return r(this,(function(t){switch(t.label){case 0:return[4,n("plugin:tracing|error",{str:e})];case 1:return t.sent(),[2]}}))}))}export{u as error,e as info,i as trace,o as warn};
