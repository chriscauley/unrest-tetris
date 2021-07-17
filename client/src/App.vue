<template>
  <div>
    <router-view />
    <unrest-ui />
    <div class="fixed bottom-0 right-0 m-4">
      <button class="btn circle -primary" @click="openDebug">
        <i class="fa fa-terminal" />
      </button>
    </div>
  </div>
</template>

<script>
import DebugForm from '@/components/DebugForm'

export default {
  methods: {
    openDebug() {
      this.$ui.alert(DebugForm)
    },
  },
}
</script>
