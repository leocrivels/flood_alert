<template>
  <Map />
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
import Map from '../components/Map';

export default {
  components: {
    Map,
  },
};
</script>
