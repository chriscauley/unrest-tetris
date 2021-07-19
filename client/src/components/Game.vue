<template>
  <svg v-bind="svg" tabindex="0" @focus="focus" @blur="blur">
    <g transform="scale(0.75)">
      <rect v-for="block in stash_blocks" v-bind="block" :key="block.key" />
    </g>
    <g :transform="`translate(${4 * scale}, ${scale})`">
      <template v-for="piece in prepped_pieces" :key="piece.id">
        <rect v-for="block in piece.blocks" v-bind="block" :key="block.key" />
      </template>
      <text v-for="block in text_blocks" v-bind="block" :key="block.key">
        {{ block.key }}
      </text>
    </g>
    <g :transform="`translate(${(4 + game.board.geo.W) * scale}, ${scale}) scale(0.75)`">
      <template v-for="piece in queued_pieces" :key="piece.id">
        <rect v-for="block in piece.blocks" v-bind="block" :key="block.key" />
      </template>
    </g>
  </svg>
</template>

<script>
import { Game, Palette, Piece } from '@unrest/tetris'
import mousetrap from '@unrest/vue-mousetrap'

export default {
  mixins: [mousetrap.Mixin],
  props: {
    saved_game: Object,
  },
  data() {
    const game = new Game(this.saved_game)
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
    svg() {
      const { W, H } = this.game.board.geo
      return {
        width: (9 + W) * this.scale,
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
    queued_pieces() {
      const { buffer, scale } = this
      return this.game.board.piece_queue.map((shape, iy) => ({
        id: `queue-${iy}`,
        blocks: Piece[shape].dxys.map(([x, y]) => ({
          x: (2 + x) * scale + buffer,
          y: (2 + y + 3 * iy) * scale + buffer,
          width: scale - 2 * buffer,
          height: scale - 2 * buffer,
          key: `queue-${iy}-${[x, y]}`,
          fill: Palette.default[shape],
        })),
      }))
    },
    stash_blocks() {
      const shape = this.game.board.stash
      if (!shape) {
        return
      }
      const { buffer, scale } = this
      return Piece[shape].dxys.map(([x, y]) => ({
        x: (2 + x) * scale + buffer,
        y: (2 + y) * scale + buffer,
        width: scale - 2 * buffer,
        height: scale - 2 * buffer,
        key: `stash-${[x, y]}`,
        fill: Palette.default[shape],
      }))
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
            fill: Palette.default[piece.shape],
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
