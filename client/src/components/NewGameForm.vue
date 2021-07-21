<template>
  <div class="modal-content">
    <unrest-form :schema="schema" :state="state" @change="update" @submit="submit">
      <template #actions>
        <button class="btn -primary">Start</button>
      </template>
    </unrest-form>
  </div>
</template>

<script>
export default {
  data() {
    const { schema, state } = this.$store.new_game
    return { schema, state }
  },
  methods: {
    update() {
      this.$store.new_game.save(this.state)
    },
    submit() {
      this.update()
      const { a, b, sticky } = this.state
      const seed = this.state.seed || new Date().valueOf() % 256
      b.seed = b.seed || new Date().valueOf() % 256
      this.$ui.alert()
      this.$store.game.save({ seed, a, b, sticky }).then((data) => {
        this.$router.push(`/play/tetris/${data.id}/`)
      })
    },
  },
}
</script>
