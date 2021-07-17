<template>
  <div class="modal-content">
    <unrest-form :schema="schema" :state="state" @change="update" @submit="submit" />
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
      this.$ui.alert()
    },
  },
}
</script>
