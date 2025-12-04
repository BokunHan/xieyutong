import App from './App';
import share from './utils/share.js';

// #ifndef VUE3
import Vue from 'vue';
import './uni.promisify.adaptor';
Vue.config.productionTip = false;
App.mpType = 'app';
Vue.mixin(share);
const app = new Vue({
	...App
});
app.$mount();
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue';
export function createApp() {
	const app = createSSRApp(App);
	app.mixin(share);
	return {
		app
	};
}
// #endif
