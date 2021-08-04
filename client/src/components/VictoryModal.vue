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
      const { campaign } = this.game.board
      return campaign ? campaign.getNextLevelText(this.game.board.options.campaign.level) : ''
    },
  },
}
</script>
