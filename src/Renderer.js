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

// TODO lodash.cloneDeep?
const cloneDeep = (o) => JSON.parse(JSON.stringify(o))

export default class Renderer {
  constructor(board, options) {
    Object.assign(this, { board, options })
    this.current = {
      frame: 0,
      subframe: 0,
    }
    this._cache = {}
    this.frames = []
  }
  get last_frame() {
    return this.frames[this.frames.length - 1]
  }
  _trlb(block_index, piece_id) {
    const { geo, indexes } = this.board
    return geo.dindexes
      .map((dindex) => (indexes[dindex + block_index] === piece_id ? 0 : 1))
      .join('')
  }

  _newPiece(piece) {
    const { board } = this
    const { scale } = this.options
    // TODO first attempt at caching wasn't great and performance isn't limited yet
    const new_piece = {
      id: piece.id,
      blocks: piece.indexes.map((index, i) => {
        const [x, y] = board.geo.index2xy(index)
        return {
          x: x * scale,
          y: y * scale,
          key: piece.block_ids[i],
          href: `#${piece.shape}-${this._trlb(index, piece.id)}`,
        }
      }),
    }
    const block = new_piece.blocks[0]
    if (piece.charges !== undefined && block) {
      new_piece.charges = {
        text: piece.charges,
        transform: `translate(${block.x}, ${block.y})`,
      }
    }
    return new_piece
  }

  draw() {
    const { board } = this
    const { scale } = this.options
    const bottom_y = Math.min(board._min_y + 17, board.geo.H)
    const skyline_y = Math.max(0, bottom_y - 17)
    const y_shift = 6 - skyline_y

    const pieces = Object.values(board.entities)
    pieces.forEach((piece) => {
      if (true || !this._cache[piece.id]) {
        this._cache[piece.id] = this._newPiece(piece)
      }
    })
    pieces.reverse()

    // create new frame
    const new_frame = {
      initial_state: {
        entities: pieces.map((piece) => this._cache[piece.id]),
        piece_queue: this.renderQueue(),
        stash: this.renderStash(),
        frame_number: this.frames.length,
        ghost: this.renderGhost(board.current_piece?.indexes),
        y_shift,
        animations: [],
        scores: this.getScores(),
      },
      actions: [],
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

  debug() {
    const frame = this.frames[this.current.frame]
    return frame?.debug()
  }

  markStale(id) {
    delete this._cache[id]
  }

  setTimeout(f, delay) {
    clearTimeout(this._timeout)
    this._timeout = setTimeout(f, delay)
  }

  next(callback) {
    const frame = this.frames[this.current.frame]
    const more_actions = this.current.subframe < frame.actions.length
    const at_end = this.current.frame === this.frames.length - 1 && !more_actions
    if (at_end || this.board._paused_at) {
      return
    }
    if (this.current.subframe < frame.actions.length) {
      frame.actions[this.current.subframe]()
      this.current.subframe++
    } else {
      this.current.frame++
      this.goToFrame(this.current.frame)
    }
    const { delay = 50 } = this
    delete this.delay
    this.setTimeout(callback, delay)
  }

  restart(callback) {
    this.goToFrame(0)
    this.setTimeout(callback, 50)
  }

  goToFrame(number) {
    this.current.frame = number
    this.current.subframe = 0
    this.state = cloneDeep(this.frames[number].initial_state)
  }

  getGhost(ghost = []) {
    const { W, H } = this.board.geo
    const max_index = W * H - 1
    let _h = H
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

  renderGhost(indexes) {
    const { scale, buffer } = this.options
    const ghost = this.getGhost(indexes)
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

  removeBlocks(piece) {
    const { block_ids } = piece
    const frame = this.last_frame
    frame.actions.push(() => {
      const entity = this.state.entities.find((e) => e.id === piece.id)
      entity.blocks = entity.blocks.filter((b) => block_ids.includes(b.id))
      // TODO animate removal
    })
  }

  moveBlocks(piece) {
    const frame = this.last_frame
    const new_piece = this._newPiece(piece)
    const new_ghost = this.renderGhost(this.board.current_piece.indexes)
    frame.actions.push(() => {
      const entity = this.state.entities.find((e) => e.id === piece.id)
      Object.assign(entity, new_piece)
      this.state.ghost = new_ghost
    })
  }

  moveCurrent() {
    this.moveBlocks(this.board.current_piece)
  }

  stash(new_piece, old_id) {
    new_piece = cloneDeep(new_piece)
    const frame = this.last_frame
    frame.actions.push(() => {
      this.state.entities = this.state.entities.filter((e) => e.id !== old_id)
      this.state.entities.push(this._newPiece(new_piece))
      this.state.ghost = this.renderGhost(new_piece.indexes)
      this.state.stash = this.renderStash()
    })
  }

  flashLines(ys) {
    if (!ys.length) {
      return
    }
    const frame = this.last_frame
    const { scale } = this.options
    frame.actions.push(() => {
      this.delay = 200
      ys.forEach((y) => {
        this.state.animations.unshift({
          key: Math.random(),
          transform: `translate(0, ${y * scale})`,
          rect: {
            height: scale,
            width: scale * this.board.geo.W,
            fill: 'pink',
          },
        })
      })
    })
  }

  addNukes(replacements) {
    replacements = cloneDeep(replacements)
    const frame = this.last_frame
    const { scale } = this.options
    frame.actions.push(() => {
      replacements.forEach((new_piece) => {
        const entity = this._newPiece(new_piece)
        this.state.entities.push(entity)
        this.state.animations.push({
          key: Math.random(),
          transform: `translate(${entity.blocks[0].x}, ${entity.blocks[0].y})`,
          class: 'animation -nuke',
          rect: {
            width: scale,
            height: scale,
            fill: `url(#${new_piece.shape}Hatch)`,
          },
        })
      })
    })
  }

  getScores() {
    const { campaign } = this.board
    if (!campaign) {
      return []
    }
    const pieces = this.board.actions.filter((a) => a.index !== undefined).length
    if (campaign.getRemainingLines(this.board) === 0) {
      const frame = this.last_frame
      frame.actions.push(() => this.board.mitt.emit('victory'))
    }
    return [campaign.getRemainingText(this.board), `${pieces} pieces placed`]
  }

  moveNukes(pieces) {
    const frame = this.last_frame
    const new_pieces = pieces.map((p) => this._newPiece(p))
    frame.actions.push(() => {
      new_pieces.forEach((piece) => {
        const entity = this.state.entities.find((e) => e.id === piece.id)
        Object.assign(entity, piece)
      })
    })
  }
}
