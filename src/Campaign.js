// Campaigns are used to control moving from one game to another while progressing the rules
import cloneDeep from 'lodash.clonedeep'
import Piece from './Piece'

const { ASH } = Piece

const slugify = (s) =>
  s
    .toString()
    .toLowerCase()
    .trim()
    .replace(/(\w)\'/g, '$1')
    .replace(/[^a-z0-9_]+/g, '-')

class Campaign {
  constructor(options) {
    const { id, name, rules, version = '1' } = options
    Object.assign(this, { id, name, rules, version })
    this.key = `${id}-${version}`
    this.slug = slugify(name)
  }
  getLevelOptions(level) {
    const rules = cloneDeep(this.rules)
    const { key } = this
    rules.b = {
      algorithm: 'mod8',
      lines: 4 * level,
    }
    return { campaign: { level, key }, rules }
  }
  getNextLevelText(level) {
    return `Advance to ${this.name} ${level + 1}`
  }
  getLevelSlug(level) {
    return slugify(`${this.name}-${level}`)
  }
  getName(level) {
    return `${this.name} lvl #${level}`
  }
  getRemainingLines(board) {
    const indexes = board.entities[ASH]?.indexes?.map(board.geo.index2xy) || []
    return [...new Set(indexes.map((xy) => xy[1]))].length
  }
  getRemainingText(board) {
    return `${this.getRemainingLines(board)} lines left`
  }
}

Campaign.list = [
  [1, 'Cascade', { cascade: true }],
  [2, 'Sticky Bomb', { sticky: true, sticky_bomb: true }],
  [3, 'Hot Fission', { nuclear: { type: 'fission', temperature: 'hot' } }],
  [4, 'Cold Fusion', { nuclear: { type: 'fusion', temperature: 'cold' } }],
].map(([id, name, rules, version]) => {
  return new Campaign({ id, name, rules, version })
})

Campaign.get = ({ key }) => Campaign.list.find((c) => c.key === key)

export default Campaign
