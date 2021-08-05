<template>
  <unrest-modal>
    <h2>Game Over</h2>
    <template #actions>
      <button class="btn -primary" @click="clone">Try again</button>
      <button class="btn -primary" @click="replay">Replay</button>
    </template>
  </unrest-modal>
</template>

<script>
export default {
  props: {
    game: Object,
    replay: Function,
    clone: Function,
  },
}
</script>
