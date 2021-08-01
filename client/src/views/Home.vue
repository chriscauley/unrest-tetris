<template>
  <div>
    <div v-for="preset in presets" :key="preset.slug" class="mb-8">
      <h4>{{ preset.name }}</h4>
      <div class="flex gap-x-2">
        <button class="btn -primary" v-for="level in levels" :key="level">
          {{ level }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { startCase, range } from 'lodash'

const _presets = {
  vanilla: { id: 1 },
  sticky: { sticky: true, id: 2 },
  cascade: { cascade: true, id: 3 },
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
}
</script>
