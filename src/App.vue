<template>
  <v-app id="inspire">

    <vue-splash
      :show="true"
      :logo="logo_app"
      title="Flood Alert"
      color="#00bfa5"
      :size="300"
      :fixed="true"
    />

    <v-content>
      <router-view/>
    </v-content>
    
  </v-app>
</template>

<style>
.vue-map-hidden {
    display: contents;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    }
</style>

<script>
import BackgroundImage from '../src/assets/teste_screen.png'
import logo_app from '../src/assets/logo_app.png'
export default {
  name: 'App',
  computed: {
    logo() {
      return BackgroundImage;
    },
  },
  watch: {
  todos: {
    handler() {
      localStorage.setItem('floodSurfaces', JSON.stringify(this.floodSurfaces));
    },
    deep: true,
  },
},
  props: {
      source: String,
    },
  data: () => ({
    drawer: null,
    logo_app: logo_app
  })
};
</script>
