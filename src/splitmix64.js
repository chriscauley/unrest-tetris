/*  Written in 2015 by Sebastiano Vigna (vigna@acm.org)

seamlessly translated to JavaScript using BigInt by Elad Karako https://icompile.eladkarako.com/splitmix64-js (January 2020).

https://gist.githubusercontent.com/eladkarako/bf3f8a6017bba9b69185e6e7b4757513/raw/f313292561e8a96b803a3ad31c2e4fd05e90e729/splitmix64.js
*/

const C1 = BigInt(0x9e3779b97f4a7c15) //saves generating BigInt constructor again and again.
const C2 = BigInt(0xbf58476d1ce4e5b9)
const C3 = BigInt(0x94d049bb133111eb)
const F1 = BigInt(30) //shifting
const F2 = BigInt(27)
const F3 = BigInt(31)

export default (seed, MAX_INT = BigInt(Number.MAX_SAFE_INTEGER)) => {
  let x = BigInt(seed)

  const rand = () => {
    x += C1

    let z = x
    z = z ^ ((z >> F1) * C2)
    z = z ^ ((z >> F2) * C3)
    z = z ^ (z >> F3)
    return Number(z % MAX_INT)
  }

  rand.choice = (array) => array[rand() % array.length]
  return rand
}
