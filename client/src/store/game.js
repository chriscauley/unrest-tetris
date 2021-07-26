import { LocalStorage } from '@unrest/vue-storage'

const fromServer = (data) => {
  if (!data.rules) {
    const { a, b, seed, sticky, cascade, ...data2 } = data
    data2.rules = { a, b, seed, sticky, cascade }
    return data2
  }
  return data
}

export default LocalStorage('game', { fromServer })
