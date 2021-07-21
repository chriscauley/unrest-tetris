import { Palette, Piece } from '@unrest/tetris'

export default (scale, buffer) => {
  const snap = Snap()
  const _sb = scale - buffer

  let i = 0
  const makeColor = (shape) => {
    const io = [1, 0]
    io.forEach((top) =>
      io.forEach((left) =>
        io.forEach((right) =>
          io.forEach((bottom) => {
            const id = `${shape}-${top}${left}${right}${bottom}`
            const g = snap.g()
            const x = (i % 8) * scale
            const y = Math.floor(i / 8) * scale
            g.attr({ id, x, y })
            const _rect = (fill, x, y, w, h) => {
              const r = snap.rect(x, y, w, h)
              r.attr({ fill })
              g.add(r)
            }
            _rect(Palette.default[shape], 0, 0, scale, scale)
            top && _rect('black', 0, 0, scale, buffer)
            left && _rect('black', 0, 0, buffer, scale)
            right && _rect('black', _sb, 0, buffer, scale)
            bottom && _rect('black', 0, _sb, scale, buffer)

            _rect('black', 0, 0, buffer, buffer)
            _rect('black', 0, _sb, buffer, buffer)
            _rect('black', _sb, 0, buffer, buffer)
            _rect('black', _sb, _sb, buffer, buffer)

            i++
          }),
        ),
      ),
    )
  }
  Piece.shapes.forEach(makeColor)
  makeColor('W')
  makeColor('A')
  snap.node.style = 'display: none'
}
