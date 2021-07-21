<template>
  <div :class="css.root">
    <svg v-bind="svg" tabindex="0" v-if="frame" ref="svg">
      <rect stroke="black" stroke-width="4" :width="scale * 4" :height="scale * 4" fill="none" />
      <g transform="scale(0.75)">
        <use v-for="block in frame.stash" v-bind="block" :key="block.key" />
      </g>
      <g :transform="`translate(${4 * scale}, ${scale})`">
        <template v-for="piece in frame.entities" :key="piece.id">
          <use v-for="block in piece.blocks" v-bind="block" :key="block.key" />
        </template>
        <text v-for="block in text_blocks" v-bind="block" :key="block.key">
          {{ block.text }}
        </text>
        <rect v-for="block in frame.ghost.blocks" v-bind="block" :key="block.key" />
      </g>
      <g :transform="`translate(${(4 + game.board.geo.W) * scale}, ${scale}) scale(0.75)`">
        <template v-for="piece in frame.piece_queue" :key="piece.id">
          <use v-for="block in piece.blocks" v-bind="block" :key="block.key" />
        </template>
      </g>
    </svg>
    <unrest-modal v-if="paused" class="game__paused -absolute">
      <template #actions>
        <button class="btn -secondary" @click="clone">Clone</button>
        <button class="btn -primary" @click="resume">Resume</button>
      </template>
    </unrest-modal>
  </div>
</template>

<script>
import { Game } from '@unrest/tetris'
import mousetrap from '@unrest/vue-mousetrap'
import makeSprites from '@/sprites'

const getBlockText = (piece, block, text) => {
  if (text === 'piece_id') {
    return piece.id
  }
  return block[text.replace('block_', '')]
}

export default {
  mixins: [mousetrap.Mixin],
  props: {
    saved_game: Object,
  },
  data() {
    const buffer = 2
    const scale = 30
    const game = new Game({...this.saved_game, buffer, scale })
    game.on('save', () => this.$store.game.save(this.game.board.serialize()))
    const mousetrap = {
      up: () => this.input('rotate'),
      right: () => this.input('right'),
      left: () => this.input('left'),
      down: () => this.input('down'),
      space: {
        keydown: () => this.input('drop'),
        keyup: () => this.input('lock'),
      },
      z: () => this.input('swap'),
      escape: () => this.[this.game.paused ? 'resume' : 'pause']()
    }
    return { game, scale, buffer, mousetrap, hash: null, paused: false, frame: null }
  },
  computed: {
    css() {
      const {half_opacity} = this.$store.debug.state
      return {
        root: ['game__wrapper', { half_opacity }]
      }
    },
    text_blocks() {
      const blocks = []
      const { text } = this.$store.debug.state
      if (['piece_id', 'block_id', 'block_key'].includes(text)) {
        this.frame.entities.forEach((piece) => {
          piece.blocks.forEach((block) =>
            blocks.push({
              x: block.x,
              y: block.y + (this.scale * 2) / 3,
              key: block.key,
              text: getBlockText(piece, block, text),
            }),
          )
        })
      } else if (text === 'board_index') {
        this.game.board?.geo.indexes.forEach((i) => {
          const xy = this.game.board.geo.index2xy(i)
          blocks.push({
            x: xy[0] * this.scale + this.buffer,
            y: xy[1] * this.scale + this.buffer + (this.scale * 2) / 3,
            key: i,
            text: i,
          })
        })
      }
      return blocks
    },
    svg() {
      const { W, H } = this.game.board.geo
      return {
        width: (9 + W) * this.scale,
        height: (2 + H) * this.scale,
      }
    },
  },
  mounted() {
    this.render()
    makeSprites(this.scale, this.buffer)
    window.addEventListener('blur', this.pause)
  },
  unmounted() {
    window.removeEventListener('blur', this.pause)
  },
  methods: {
    input(action) {
      this.game.input(action)
      this.render()
    },
    render() {
      this.frame = this.game.board.renderer.next(this.render)
    },
    pause() {
      // TODO should be this.game.paused, but for some reason the modal isn't listening to that
      this.paused = true
      this.game.pause()
    },
    resume() {
      this.paused = false
      this.game.resume()
      this.render()
    },
    clone() {
      const { id, hash, actions, ...options } = this.saved_game // eslint-disable-line
      this.$store.game.save(options).then((data) => {
        this.$router.push(`/play/tetris/${data.id}/`)
      })
    },
  },
}
</script>
