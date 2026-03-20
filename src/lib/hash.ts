export type HashFunction = 'djb2' | 'simple-mod' | 'fnv1a' | 'polynomial';

export function hashWord(word: string, fn: HashFunction, tableSize: number): number {
  switch (fn) {
    case 'djb2':
      return djb2(word, tableSize);
    case 'simple-mod':
      return simpleMod(word, tableSize);
    case 'fnv1a':
      return fnv1a(word, tableSize);
    case 'polynomial':
      return polynomial(word, tableSize);
  }
}

function djb2(str: string, mod: number): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % mod;
}

function simpleMod(str: string, mod: number): number {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    sum += str.charCodeAt(i);
  }
  return sum % mod;
}

function fnv1a(str: string, mod: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) & 0xffffffff;
  }
  return Math.abs(hash) % mod;
}

function polynomial(str: string, mod: number): number {
  const p = 31;
  let hash = 0;
  let pPow = 1;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + (str.charCodeAt(i) - 96) * pPow) % mod;
    pPow = (pPow * p) % mod;
  }
  return Math.abs(hash) % mod;
}

export const HASH_FUNCTIONS: { value: HashFunction; label: string; description: string }[] = [
  { value: 'djb2', label: 'DJB2', description: 'hash = hash * 33 + c' },
  { value: 'simple-mod', label: 'Soma Módulo', description: 'soma dos ASCII % tamanho' },
  { value: 'fnv1a', label: 'FNV-1a', description: 'XOR + multiplicação' },
  { value: 'polynomial', label: 'Polinomial', description: 'hash = Σ(c·pⁱ) % m' },
];