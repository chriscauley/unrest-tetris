<template>
  <unrest-modal v-if="open" @close="open = false" header="You win">
    <p>{{ text }}</p>
  </unrest-modal>
  <div v-else class="btn -primary victory-button" @click="open = true">
    You win!
  </div>
</template>

<script>
export default {
  props: {
    game: Object,
  },
  data() {
    return { open: true }
  },
  computed: {
    text() {
      const { mode } = this.game.board
      return mode ? mode.nextLevelText : ''
    },
  },
}
</script>
