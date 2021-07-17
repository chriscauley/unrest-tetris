<template>
  <svg v-bind="svg" tabindex="0" @focus="focus" @blur="blur">
    <rect v-bind="outer_rect" fill="none" stroke="black" />
    <g :transform="`translate(${scale}, ${scale})`">
      <template v-for="piece in prepped_pieces" :key="piece.id">
        <rect v-for="block in piece.blocks" v-bind="block" :key="block.key" />
      </template>
      <text v-for="block in text_blocks" v-bind="block" :key="block.key">
        {{ block.key }}
      </text>
    </g>
  </svg>
</template>

<script>
import { Game } from '@unrest/tetris'
import mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [mousetrap.Mixin],
  data() {
    const game = new Game(this.$route.query)
    const mousetrap = {
      up: () => this.input('rotate'),
      right: () => this.input('right'),
      left: () => this.input('left'),
      down: () => this.input('down'),
      space: {
        keydown: () => this.input('drop'),
        keyup: () => this.input('lock'),
      },
    }
    return { game, scale: 30, buffer: 2, mousetrap, hash: null }
  },
  computed: {
    text_blocks() {
      const blocks = []
      const { text } = this.$store.debug.state
      if (text === 'piece_index') {
        this.prepped_pieces.forEach((piece) => {
          piece.blocks.forEach((block) =>
            blocks.push({
              x: block.x,
              y: block.y + this.scale / 2,
              key: block.key,
            }),
          )
        })
      } else if (text === 'board_index') {
        this.game.board?.geo.indexes.forEach((i) => {
          const xy = this.game.board.geo.index2xy(i)
          blocks.push({
            x: xy[0] * this.scale + this.buffer,
            y: xy[1] * this.scale + this.buffer + this.scale / 2,
            key: i,
          })
        })
      }
      return blocks
    },
    outer_rect() {
      const { W, H } = this.game.board.geo
      const { scale, buffer } = this
      return {
        x: scale / 2,
        y: scale / 2,
        width: scale * (W + 1),
        height: scale * (H + 1),
        'stroke-width': scale - buffer,
      }
    },
    svg() {
      const { W, H } = this.game.board.geo
      return {
        width: (2 + W) * this.scale,
        height: (2 + H) * this.scale,
      }
    },
    prepped_pieces() {
      const pieces = this.pieces
      pieces.push(this.ghost)
      return pieces
    },
    ghost() {
      const { scale, buffer } = this
      const blocks = this.game.board.ghost?.map((index, i) => {
        const [x, y] = this.game.board.geo.index2xy(index)
        return {
          key: `g-${i}`,
          x: x * scale + buffer,
          y: y * scale + buffer,
          width: scale - 2 * buffer,
          height: scale - 2 * buffer,
          fill: 'none',
          'stroke-width': buffer,
          stroke: 'gray',
          'stroke-dasharray': 4,
        }
      })
      return { id: 'ghost', blocks }
    },
    pieces() {
      const { buffer, scale } = this
      const { index2xy } = this.game.board.geo
      return Object.values(this.game.board.entities).map((piece) => ({
        id: piece.id,
        blocks: piece.indexes.map((index, i) => {
          const [x, y] = index2xy(index)
          return {
            x: x * scale + buffer,
            y: y * scale + buffer,
            width: scale - 2 * buffer,
            height: scale - 2 * buffer,
            key: `${piece.id}-${piece.block_ids[i]}`,
            fill: 'gray',
          }
        }),
      }))
    },
  },
  methods: {
    input(action) {
      this.game.input(action)
      this.hash = Math.random()
    },
    focus() {
      // this.game.pause()
    },
    blur() {
      // this.game.resume()
    },
  },
}
</script>
