import splitmix64 from '../src/splitmix64'

test('splitmix64', () => {
  const rand = splitmix64(0)
  const first50 = new Array(50).fill(0).map(() => rand() % 8)
  expect(first50.join(',')).toMatchSnapshot()
})
