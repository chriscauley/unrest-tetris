import { Palette, Piece } from '@unrest/tetris'

const { WALL, ASH, HOT, COLD } = Piece

const always_y = [ASH, HOT, COLD]
const always_x = [HOT, COLD]

export default (scale, buffer) => {
  const snap = Snap()
  const _sb = scale - buffer

  let _i = 0
  const makeColor = (shape) => {
    const io = [1, 0]
    io.forEach((top) =>
      io.forEach((left) =>
        io.forEach((right) =>
          io.forEach((bottom) => {
            const id = `${shape}-${top}${left}${right}${bottom}`
            const g = snap.g()
            g.attr({ id })
            // next line is good for debugging but breaks graphics in game
            // g.attr({ id, transform: `translate(${1.1*(i%16)*scale}, ${1.1*Math.floor(i/16)*scale})` })
            const _rect = (fill, x, y, w, h) => {
              const r = snap.rect(x, y, w, h)
              r.attr({ fill })
              g.add(r)
            }

            // A doesn't look good all merged up
            const _top = top || always_y.includes(shape)
            const _bottom = bottom || always_y.includes(shape)
            const _left = left || always_x.includes(shape)
            const _right = right || always_x.includes(shape)

            _rect(Palette.default[shape], 0, 0, scale, scale)
            _top && _rect('black', 0, 0, scale, buffer)
            _left && _rect('black', 0, 0, buffer, scale)
            _right && _rect('black', _sb, 0, buffer, scale)
            _bottom && _rect('black', 0, _sb, scale, buffer)

            _rect('black', 0, 0, buffer, buffer)
            _rect('black', 0, _sb, buffer, buffer)
            _rect('black', _sb, 0, buffer, buffer)
            _rect('black', _sb, _sb, buffer, buffer)
            _i++
          }),
        ),
      ),
    )
  }
  Piece.shapes.forEach(makeColor)
  makeColor(WALL)
  makeColor(ASH)
  makeColor(COLD)
  makeColor(HOT)
  snap.node.style = 'display: none'
}
