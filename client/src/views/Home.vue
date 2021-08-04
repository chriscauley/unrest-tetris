<template>
  <div class="flex items-center justify-center h-full absolute w-full">
    <div class="card">
      <div class="card-body">
        <div class="card-title">
          <h2>Select a game</h2>
        </div>
        <div v-for="preset in presets" :key="preset.slug" class="mb-8">
          <h4>{{ preset.name }}</h4>
          <div class="flex gap-x-2">
            <button
              class="btn -primary"
              @click="play(preset, level)"
              v-for="level in levels"
              :key="level"
            >
              {{ level }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, range } from 'lodash'
import { Mode } from '@unrest/tetris'

const _presets = {
  cascade: { cascade: true, id: 3 },
  sticky_bomb: { sticky: true, sticky_bomb: true, id: 2 },
  hot_fission: { nuclear: { type: 'fission', temperature: 'hot' }, id: 4 },
  cold_fusion: { nuclear: { type: 'fusion', temperature: 'cold' }, id: 5 },
}
const presets = Object.entries(_presets).map(([slug, rules]) => {
  const name = startCase(slug)
  return { slug, name, rules }
})

export default {
  __route: {
    path: '/',
  },
  data() {
    return {
      presets,
      levels: range(1, 8),
    }
  },
  methods: {
    play(preset, level) {
      const { name, slug } = preset
      const options = Mode.b0.getOptions(
        {
          mode: { name, slug, goal: 'b0' },
          rules: {
            ...preset.rules,
            b: { algorithm: 'mod8' },
          },
        },
        level,
      )
      this.$store.game.save(options).then((data) => {
        this.$router.push(`/play/${preset.slug}-${level}/${data.id}/`)
      })
    },
  },
}
</script>
