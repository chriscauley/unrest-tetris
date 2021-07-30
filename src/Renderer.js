import Piece from './Piece'
import Geo from '@unrest/geo'

const tlrbByShape = {}
const geo4 = new Geo(4, 4)
Piece.all.forEach((piece) => {
  const exists = {}
  const indexes = piece.dxys.map((dxy) => geo4.dxy2dindex(dxy))
  piece.dxys.forEach((dxy) => (exists[geo4.xy2index(dxy)] = true))
  tlrbByShape[piece.shape] = indexes.map((index) =>
    [-4, -1, 1, 4].map((dindex) => (indexes.includes(dindex + index) ? 0 : 1)).join(''),
  )
})

export default class Renderer {
  constructor(board, options) {
    Object.assign(this, { board, options })
    this.current_frame = 0
    this._cache = {}
    this.frames = []
  }
  _getCached(key, f) {
    if (!this._cache[key]) {
      this._cache[key] = f()
    }
    return this._cache[key]
  }
  _trlb(block_index, piece_id) {
    const { geo, indexes } = this.board
    return geo.dindexes
      .map((dindex) => (indexes[dindex + block_index] === piece_id ? 0 : 1))
      .join('')
  }
  draw(delay = 0) {
    const { board } = this
    const { scale } = this.options
    const bottom_y = Math.min(board._min_y + 17, board.geo.H)
    const skyline_y = Math.max(0, bottom_y - 17)
    const y_shift = 6 - skyline_y

    const pieces = Object.values(board.entities)
    pieces.forEach((piece) => {
      // TODO first attempt at caching wasn't great and performance isn't limited yet
      if (true || !this._cache[piece.id]) {
        const piece_key = piece.id === board.current_piece.id ? Math.random() : piece.id
        this._cache[piece.id] = {
          id: piece.id,
          blocks: piece.indexes.map((index, i) => {
            const [x, y] = board.geo.index2xy(index)
            return {
              x: x * scale,
              y: y * scale,
              key: `${piece_key}-${piece.block_ids[i]}`,
              href: `#${piece.shape}-${this._trlb(index, piece.id)}`,
            }
          }),
        }
        if (piece.charges) {
          const block = this._cache[piece.id].blocks[0]
          this._cache[piece.id].charges = {
            text: piece.charges,
            transform: `translate(${block.x}, ${block.y})`,
          }
        }
      }
    })

    // create new frame
    const new_frame = {
      entities: pieces.map((piece) => this._cache[piece.id]),
      piece_queue: this._getCached('queue', () => this.renderQueue()),
      stash: this._getCached('stash', () => this.renderStash()),
      frame_number: this.frames.length,
      delay: delay * 1,
      ghost: this.renderGhost(),
      y_shift,
    }

    const { _skyline, _sealevel } = board

    new_frame.debug = () => {
      const debug = { texts: [], rects: [], lines: [] }
      if (this.options.debug.annotate) {
        debug.lines.push(this.debugLine(_skyline * scale, 'orange'))
        debug.lines.push(this.debugLine(_sealevel * scale, 'blue'))
        Array(1 + Math.ceil(board.geo.H / 5))
          .fill(0)
          .forEach((_, i) => {
            const xywk = {
              x: scale * (this.board.geo.W - 1),
              y: i * 5 * scale,
              width: scale,
              key: `debug-${i}`,
            }
            debug.rects.push({
              ...xywk,
              height: scale,
              fill: 'pink',
            })
            debug.texts.push({
              ...xywk,
              text: `y${i * 5}`,
              y: xywk.y + scale * 0.7,
            })
          })
      }
      return debug
    }

    this.frames.push(new_frame)
  }

  markStale(id) {
    delete this._cache[id]
  }

  next(callback) {
    if (this.current_frame < this.frames.length - 1 && !this.board._paused_at) {
      this.current_frame++
      setTimeout(callback, this.frames[this.current_frame]?.delay * 3)
    }
    return this.frames[this.current_frame]
  }

  restart(callback) {
    this.current_frame = 0
    return this.next(callback)
  }

  getGhost() {
    const { W, H } = this.board.geo
    const max_index = W * H - 1
    let _h = H
    let ghost = this.board.current_piece?.indexes || []
    while (_h--) {
      const new_ghost = ghost.map((i) => i + W)
      const collides = new_ghost.find((index) => {
        if (index > max_index) {
          return true
        }
        if (this.board.indexes[index] === undefined) {
          return false
        }
        return this.board.indexes[index] !== this.board.current_piece.id
      })
      if (collides !== undefined) {
        break
      }
      ghost = new_ghost
    }
    return ghost
  }

  renderGhost() {
    const { scale, buffer } = this.options
    const ghost = this.getGhost(this.board)
    const willBeEmpty = (i) => !(this.board.indexes[i] || ghost.includes(i))
    const wouldEliminate = (y) => undefined === this.board.geo.getRowIndexes(y).find(willBeEmpty)
    const blocks = ghost.map((index) => {
      const [x, y] = this.board.geo.index2xy(index)
      return {
        key: Math.random(),
        x: x * scale + buffer,
        y: y * scale + buffer,
        width: scale - 2 * buffer,
        height: scale - 2 * buffer,
        fill: 'none',
        'stroke-width': buffer,
        stroke: wouldEliminate(y) ? 'red' : 'gray',
        'stroke-dasharray': 4,
      }
    })
    return { id: 'ghost', blocks }
  }

  renderQueue() {
    const { scale } = this.options
    return this.board.piece_queue.map((shape, iy) => ({
      id: `queue-${iy}`,
      blocks: Piece[shape].dxys.map(([x, y], i) => ({
        x: (2 + x) * scale,
        y: (2 + y + 3 * iy) * scale,
        key: `queue-${iy}-${[x, y]}`,
        href: `#${shape}-${tlrbByShape[shape][i]}`,
      })),
    }))
  }

  renderStash() {
    const shape = this.board.stash
    const { scale } = this.options
    return Piece[shape]?.dxys.map(([x, y], i) => ({
      x: (2 + x) * scale,
      y: (2 + y) * scale,
      key: `stash-${[x, y]}`,
      href: `#${shape}-${tlrbByShape[shape][i]}`,
    }))
  }

  debugLine(y, stroke) {
    const { W } = this.board.geo
    const { scale } = this.options
    return {
      y,
      stroke,
      x: -scale,
      width: (W + 2) * scale,
      height: 3,
      fill: 'none',
      'stroke-width': 2,
    }
  }
}
