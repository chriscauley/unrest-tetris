<template>
  <div class="modal-content">
    <unrest-form :state="state" :schema="schema" @submit="$ui.alert(null)" @change="update">
      <template #actions>
        <button class="btn -primary">Okay</button>
      </template>
    </unrest-form>
  </div>
</template>

<script>
export default {
  data() {
    const { schema, state } = this.$store.debug
    return { schema, state }
  },
  methods: {
    update() {
      this.$store.debug.save(this.state)
    },
  },
}
</script>
