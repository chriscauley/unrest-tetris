<template>
  <unrest-modal v-if="open" @close="open = false" header="You win">
    <p>{{ text }}</p>
    <template #actions>
      <button class="btn -primary" @click="playNext">Next Level</button>
      <button class="btn -secondary" @click="replay">Watch Replay</button>
    </template>
  </unrest-modal>
  <div v-else class="btn -primary victory-button" @click="open = true">You win!</div>
</template>

<script>
export default {
  props: {
    game: Object,
    replay: Function,
  },
  data() {
    return { open: true }
  },
  computed: {
    campaign() {
      return this.game.board.campaign
    },
    text() {
      const { campaign } = this.game.board
      return campaign ? campaign.getNextLevelText(this.game.board.options.campaign.level) : ''
    },
  },
  methods: {
    playNext() {
      const { level } = this.game.board.options.campaign
      this.$store.game.save(this.campaign.getLevelOptions(level + 1)).then((data) => {
        this.$router.push(`/play/tetris/${data.id}/`)
      })
    },
  },
}
</script>
