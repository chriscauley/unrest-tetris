<template>
  <div :class="css.root">
    <svg v-bind="svg.root" tabindex="0" v-if="frame.entities" ref="svg">
      <rect stroke="black" stroke-width="4" :width="scale * 4" :height="scale * 4" fill="none" />
      <g transform="scale(0.75)">
        <use v-for="block in frame.stash" v-bind="block" :key="block.key" />
      </g>
      <rect v-for="(line, i) in svg.lines" v-bind="line" :key="i" />
      <rect v-bind="svg.sea_level" />
      <g :transform="`translate(${4 * scale}, ${scale * frame.y_shift})`">
        <rect fill="url(#dangerHatch)" :width="scale * game.board.geo.W" :height="scale * 3" />
        <template v-for="(piece, i) in frame.entities" :key="i">
          <use v-for="block in piece.blocks" v-bind="block" :key="block.key" />
          <g v-if="piece.charges" :transform="piece.charges.transform">
            <ellipse v-bind="svg.charge_ellipse" />
            <text :x="scale / 3" :y="(scale * 2) / 3">{{ piece.charges.text }}</text>
          </g>
        </template>
        <text v-for="block in text_blocks" v-bind="block" :key="block.key">
          {{ block.text }}
        </text>
        <rect v-for="block in frame._debug.rects" v-bind="block" :key="block.key" />
        <text v-for="block in frame._debug.texts" v-bind="block" :key="block.key">
          {{ block.text }}
        </text>
        <rect v-for="block in frame.ghost.blocks" v-bind="block" :key="block.key" />
        <rect v-for="(line, i) in frame._debug.lines" v-bind="line" :key="i" />
        <g v-for="a in frame.animations" :class="a.class" :transform="a.transform" :key="a.key">
          <rect v-if="a.rect" v-bind="a.rect" />
        </g>
      </g>
      <g :transform="`translate(${(4 + game.board.geo.W) * scale}, ${scale}) scale(0.75)`">
        <template v-for="piece in frame.piece_queue" :key="piece.id">
          <use v-for="block in piece.blocks" v-bind="block" :key="block.key" />
        </template>
      </g>
      <pattern id="dangerHatch" patternUnits="userSpaceOnUse" v-bind="svg.danger_pattern">
        <rect v-bind="svg.danger_bg" />
        <path v-bind="svg.danger_path" />
      </pattern>
      <pattern id="CHatch" patternUnits="userSpaceOnUse" v-bind="svg.cold_pattern">
        <rect v-bind="svg.cold_bg" />
        <path v-bind="svg.cold_path" />
      </pattern>
      <pattern id="HHatch" patternUnits="userSpaceOnUse" v-bind="svg.hot_pattern">
        <rect v-bind="svg.hot_bg" />
        <path v-bind="svg.hot_path" />
      </pattern>
    </svg>
    <unrest-modal v-if="paused" class="game__paused -absolute">
      <template #actions>
        <button class="btn -secondary" @click="replay">Replay</button>
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

const range = i => new Array(i).fill().map((_, i) => i)

export default {
  mixins: [mousetrap.Mixin],
  props: {
    saved_game: Object,
  },
  data() {
    const buffer = 2
    const scale = 30
    return { game: null, scale, buffer, hash: null, paused: false, frame: {} }
  },
  computed: {
    mousetrap() {
      return {
        up: () => this.input('rotate') || false,
        right: () => this.input('right'),
        left: () => this.input('left'),
        down: () => this.input('down'),
        space: {
          keydown: () => this.input('drop') || false,
          keyup: () => this.input('lock'),
        },
        z: () => this.input('swap'),
        escape: () => this.[this.game.paused ? 'resume' : 'pause']()
      }
    },
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
        this.frame.entities.filter(p => typeof p.id === 'number').forEach((piece) => {
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
      const { W } = this.game.board.geo
      const { scale, buffer } = this
      const width = (9 + W) * this.scale
      const skyline = {
        fill: 'red',
        width: scale * (this.game.board.geo.W + 2),
        height: buffer,
        x: 3 * scale,
        y: 6 * scale,
      }

      const lines = [skyline]
      this.$store.debug.state.annotate && range(5).forEach(i =>
        lines.push({ ...skyline, fill: 'black', y: scale * 5 * i })
      )
      const d_scale = 6
      const n_scale = 1

      return {
        root: {
          width,
          height: 27 * this.scale,
        },
        lines,
        sea_level: {
          fill: 'rgba(0,0,0,0.2)',
          width,
          height: scale * 10,
          y: scale * 22,
        },
        danger_bg: { fill: "#fbb", width: "100%", height: "100%" },
        danger_pattern: { width: 4*d_scale, height: 4* d_scale },
        danger_path: {
          d: `M-1,1 l2,-2
              M0,4 l4,-4
              M3,5 l2,-2`.replace(/\d+/g, i => i * d_scale),
          style: `stroke: #F00; stroke-width:${1.5 * d_scale}`, // stroke-width is a guess
        },
        hot_bg: { fill: "#888", width: "100%", height: "100%" },
        hot_pattern: { width: 4*n_scale, height: 4* n_scale },
        hot_path: {
          d: `M-1,1 l2,-2
              M0,4 l4,-4
              M3,5 l2,-2`.replace(/\d+/g, i => i * n_scale),
          style: `stroke: #F00; stroke-width:${1.5 * n_scale}`, // stroke-width is a guess
        },
        cold_bg: { fill: "#888", width: "100%", height: "100%" },
        cold_pattern: { width: 4*n_scale, height: 4* n_scale },
        cold_path: {
          d: `M-1,1 l2,-2
              M0,4 l4,-4
              M3,5 l2,-2`.replace(/\d+/g, i => i * n_scale),
          style: `stroke: #00F; stroke-width:${1.5 * n_scale}`, // stroke-width is a guess
        },
        charge_ellipse: {
          cx: scale / 2,
          cy: scale / 2,
          rx: scale / 3,
          ry: scale / 3,
          fill: 'white',
        }
      }
    },
  },
  mounted() {
    makeSprites(this.scale, this.buffer)
    this.restart()
    window.addEventListener('blur', this.pause)
  },
  unmounted() {
    window.removeEventListener('blur', this.pause)
  },
  methods: {
    restart() {
      const { scale, buffer } = this
      const render_options = { debug: this.$store.debug.state, scale, buffer }
      this.game = new Game({...this.saved_game, buffer, scale, render_options })
      this.game.on('save', () => this.$store.game.save(this.game.board.serialize()))
      this.replay()
    },
    replay() {
      const { renderer } = this.game.board
      renderer.restart(this.render)
      Object.assign(this.frame, renderer.state)
      this.resume()
    },
    input(action) {
      this.game.input(action)
      this.render()
    },
    render() {
      const { renderer } = this.game.board
      renderer.next(this.render)
      Object.assign(this.frame, renderer.state)
      this.frame._debug = renderer.debug()
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
