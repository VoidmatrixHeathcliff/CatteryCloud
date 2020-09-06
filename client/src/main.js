import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import ViewUI from 'view-design'
import router from './router/router.js'
import 'view-design/dist/styles/iview.css';
import axios from 'axios'
import VueAxios from 'vue-axios'

Vue.config.productionTip = false

Vue.use(VueRouter);
Vue.use(ViewUI);

Vue.use(VueAxios, axios);
Vue.prototype.$axios = axios;

new Vue({
    render: h => h(App),
    router
}).$mount('#app')

