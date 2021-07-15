<template>
  <div class="flex">
    <game :key="$route.fullPath" />
    <div>
      <ul>
        <li v-for="shape in shapes" :key="shape">
          <router-link :to="`?seed=${shape}`">{{ shape }}</router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Game from '@/components/Game'
import { Piece } from '@unrest/tetris'

export default {
  components: { Game },
  data() {
    const { shapes } = Piece
    return { shapes }
  },
}
</script>
