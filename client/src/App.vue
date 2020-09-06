<template>
    <div id="app">
        <Index/>
        <BackTop></BackTop>
    </div>
</template>w

<script>
import Index from './Views/Index.vue'

export default {
    name: 'App',
    components: {
        Index,
    },
    beforeCreate() {
        document.querySelector('body').setAttribute('style', 'background-color:#ffe7c6;')
    },
}
</script>

<style>
#app {
    text-align: center;
    padding: 3% 3% 3% 3%;
    width: 100%;
    height: 100%;
}
</style>
