<template>
  <game v-if="game" :saved_game="game" :key="$route.fullPath" />
</template>

<script>
import Game from '@/components/Game'
import { startCase } from 'lodash'

export default {
  name: 'GameView',
  __route: {
    path: '/play/:game_name/:game_id/',
    title: (to) => startCase(to.params.game_name),
  },
  components: { Game },
  computed: {
    game() {
      return this.$store.game.getOne(this.$route.params.game_id)
    },
  },
}
</script>
