import splitmix64 from './splitmix64'

const mod8 = (seed) => {
  seed = seed || Math.floor(1e6 * Math.random())
  const rand = splitmix64(seed)
  return () => rand() % 8
}

export default { mod8 }
