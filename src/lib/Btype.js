import splitmix64 from './splitmix64'

const mod8 = (seed) => {
  const rand = splitmix64(seed)
  return () => rand() % 8
}

export default { mod8 }
