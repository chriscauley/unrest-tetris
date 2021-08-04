<template>
  <div class="flex items-center justify-center h-full absolute w-full">
    <div class="card">
      <div class="card-body">
        <div class="card-title">
          <h2>Select a game</h2>
        </div>
        <div v-for="campaign in campaigns" :key="campaign.key" class="mb-8">
          <h4>{{ campaign.name }}</h4>
          <div class="flex gap-x-2">
            <button
              class="btn -primary"
              @click="play(campaign, level)"
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
import { Campaign } from '@unrest/tetris'

export default {
  __route: {
    path: '/',
  },
  data() {
    return {
      campaigns: Campaign.list,
      levels: range(1, 8),
    }
  },
  methods: {
    play(campaign, level) {
      const options = campaign.getOptions(level)
      this.$store.game.save(options).then((data) => {
        this.$router.push(`/play/${campaign.getLevelSlug(level)}/${data.id}/`)
      })
    },
  },
}
</script>
