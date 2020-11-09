import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import * as VueGoogleMaps from 'vue2-google-maps'
import VueGeolocationApi from 'vue-geolocation-api'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { rtdbPlugin } from 'vuefire'
import VueSplash from 'vue-splash'

Vue.use(rtdbPlugin)
 
Vue.use(VueGeolocationApi/*, { ...options } */)
 
Vue.use(VueSplash)

Vue.use(VueGoogleMaps, {
  load: {
    key: 'YOUR_MAPS_KEY',
    libraries: 'visualization',
  },
})

window.Event = new class {

  constructor() {
    this.vue = new Vue();
  }

}

Vue.config.productionTip = false

new Vue({
  data: {
    floodArea: []
  },
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
