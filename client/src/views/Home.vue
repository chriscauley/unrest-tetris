<template>
  <div class="view-home">
    <div class="card">
      <div class="card-body">
        <div class="card-title">
          <h2>Select a game</h2>
        </div>
        <div v-for="campaign in campaigns" :key="campaign.key">
          <h4>{{ campaign.name }}</h4>
          <div class="button-set">
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
import { range } from 'lodash'

export default {
  __route: {
    path: '/',
  },
  name: 'HomeView',
  data() {
    return {
      campaigns: Campaign.list,
      levels: range(1, 8),
    }
  },
  methods: {
    play(campaign, level) {
      const options = campaign.getLevelOptions(level)
      this.$store.game.save(options).then((data) => {
        this.$router.push(`/play/${campaign.getLevelSlug(level)}/${data.id}/`)
      })
    },
  },
}
</script>
