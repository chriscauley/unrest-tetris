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

const getGhost = (board) => {
  const { W, H } = board.geo
  const max_index = W * H - 1
  let _h = H
  let ghost = board.current_piece?.indexes || []
  while (_h--) {
    const new_ghost = ghost.map((i) => i + W)
    const collides = new_ghost.find((index) => {
      if (index > max_index) {
        return true
      }
      if (board.indexes[index] === undefined) {
        return false
      }
      return board.indexes[index] !== board.current_piece.id
    })
    if (collides !== undefined) {
      break
    }
    ghost = new_ghost
  }
  return ghost
}

const renderGhost = (board, render_options) => {
  const { scale, buffer } = render_options
  const blocks = getGhost(board).map((index) => {
    const [x, y] = board.geo.index2xy(index)
    return {
      key: Math.random(),
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
}

const renderQueue = (board, render_options) => {
  const { scale } = render_options
  return board.piece_queue.map((shape, iy) => ({
    id: `queue-${iy}`,
    blocks: Piece[shape].dxys.map(([x, y], i) => ({
      x: (2 + x) * scale,
      y: (2 + y + 3 * iy) * scale,
      key: `queue-${iy}-${[x, y]}`,
      href: `#${shape}-${tlrbByShape[shape][i]}`,
    })),
  }))
}

const renderStash = (board, render_options) => {
  const shape = board.stash
  const { scale } = render_options
  return Piece[shape]?.dxys.map(([x, y], i) => ({
    x: (2 + x) * scale,
    y: (2 + y) * scale,
    key: `stash-${[x, y]}`,
    href: `#${shape}-${tlrbByShape[shape][i]}`,
  }))
}

const debugLine = (board, { scale }, y, stroke) => ({
  y,
  stroke,
  x: -scale,
  width: (board.geo.W + 2) * scale,
  height: 3,
  fill: 'none',
  'stroke-width': 2,
})

export default (board, render_options) => {
  let current_frame = 0
  let stale = []
  const _cache = {}
  const frames = []
  const getCached = (key, f) => {
    if (!_cache[key]) {
      _cache[key] = f()
    }
    return _cache[key]
  }

  const tlrd = (block_index, piece_id) => {
    return board.geo.dindexes
      .map((dindex) => (board.indexes[dindex + block_index] === piece_id ? 0 : 1))
      .join('')
  }

  const draw = (delay = 0) => {
    const { scale } = render_options
    const bottom_y = Math.min(board._min_y + 17, board.geo.H)
    const skyline_y = Math.max(0, bottom_y - 17)
    const y_shift = 6 - skyline_y

    const pieces = Object.values(board.entities)
    // clear cache of stale and wet cache
    stale.forEach((id) => delete _cache[id])
    stale = []
    pieces.forEach((piece) => {
      // TODO first attempt at caching wasn't great and performance isn't limited yet
      if (true || !_cache[piece.id]) {
        const piece_key = piece.id === board.current_piece.id ? Math.random() : piece.id
        _cache[piece.id] = {
          id: piece.id,
          blocks: piece.indexes.map((index, i) => {
            const [x, y] = board.geo.index2xy(index)
            return {
              x: x * scale,
              y: y * scale,
              key: `${piece_key}-${piece.block_ids[i]}`,
              href: `#${piece.shape}-${tlrd(index, piece.id)}`,
            }
          }),
        }
      }
    })

    // create new frame
    const new_frame = {
      entities: pieces.map((piece) => _cache[piece.id]),
      piece_queue: getCached('queue', () => renderQueue(board, render_options)),
      stash: getCached('stash', () => renderStash(board, render_options)),
      frame_number: frames.length,
      delay: delay * 1,
      ghost: renderGhost(board, render_options),
      y_shift,
    }

    new_frame.debug = () => {
      const debug = { texts: [], rects: [], lines: [] }
      if (render_options.debug.annotate) {
        debug.lines.push(debugLine(board, render_options, board._sky_line * scale, 'orange'))
        debug.lines.push(debugLine(board, render_options, board._sealevel * scale, 'blue'))
        Array(1 + Math.ceil(board.geo.H / 5))
          .fill(0)
          .forEach((_, i) => {
            const arst = {
              y: i * 5 * scale,
              x: scale * 12,
              width: scale * 2,
            }
            debug.rects.push({
              height: scale,
              fill: 'pink',
              key: `debug-${i}`,
              ...arst,
            })
            debug.texts.push({
              ...arst,
              text: `y=${i * 5}`,
              y: arst.y + scale * 0.7,
            })
          })
      }
      return debug
    }

    frames.push(new_frame)
  }

  return {
    draw,
    frames,
    markStale(id) {
      stale.push(id)
    },
    next(callback) {
      if (current_frame < frames.length - 1 && !board._paused_at) {
        current_frame++
        setTimeout(callback, frames[current_frame]?.delay / 2)
      }
      return frames[current_frame]
    },
    restart(callback) {
      current_frame = 0
      return this.next(callback)
    },
  }
}
