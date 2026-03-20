import { hashWord, type HashFunction } from "./hash";

export interface SearchResult {
  found: boolean;
  word: string;
  hashIndexTime: number;    // seconds, 6 decimal places
  tableScanTime: number;    // seconds, 6 decimal places
  timeReduction: number;    // percentage, 2 decimal places
  speedup: number;          // float, 2 decimal places
  bucketIndex?: number;
  pageIndex?: number;
}

export interface PageData {
  pageIndex: number;
  buckets: BucketData[];
  totalWords: number;
  totalCollisions: number;
  maxBucketSize: number;
  overflows: number;
}

export interface BucketData {
  index: number;
  words: string[];
  collisionCount: number;
}

/**
 * Builds a hash table structure grouped by pages.
 * Each page contains `bucketsPerPage` buckets.
 */
export function buildPagedHashTable(
  words: string[],
  hashFn: HashFunction,
  totalBuckets: number,
  bucketsPerPage: number
): PageData[] {
  const table: string[][] = Array.from({ length: totalBuckets }, () => []);
  
  for (const w of words) {
    const idx = hashWord(w, hashFn, totalBuckets);
    table[idx].push(w);
  }

  const totalPages = Math.ceil(totalBuckets / bucketsPerPage);
  const pages: PageData[] = [];

  for (let p = 0; p < totalPages; p++) {
    const start = p * bucketsPerPage;
    const end = Math.min(start + bucketsPerPage, totalBuckets);
    const buckets: BucketData[] = [];
    let totalWords = 0;
    let totalCollisions = 0;
    let maxBucketSize = 0;
    let overflows = 0;

    for (let i = start; i < end; i++) {
      const words = table[i];
      const collisionCount = Math.max(0, words.length - 1);
      buckets.push({ index: i, words, collisionCount });
      totalWords += words.length;
      totalCollisions += collisionCount;
      maxBucketSize = Math.max(maxBucketSize, words.length);
      if (words.length > 1) overflows++;
    }

    pages.push({ pageIndex: p, buckets, totalWords, totalCollisions, maxBucketSize, overflows });
  }

  return pages;
}

/**
 * Performs search using hash index (O(1) average) and table scan (O(n)),
 * measuring real execution time for both.
 */
export function searchWord(
  word: string,
  allWords: string[],
  hashFn: HashFunction,
  totalBuckets: number,
  bucketsPerPage: number
): SearchResult {
  const normalizedWord = word.trim().toLowerCase();

  // Hash index search
  const hashStart = performance.now();
  const bucketIdx = hashWord(normalizedWord, hashFn, totalBuckets);
  const table: string[][] = Array.from({ length: totalBuckets }, () => []);
  for (const w of allWords) {
    table[hashWord(w, hashFn, totalBuckets)].push(w);
  }
  const foundInHash = table[bucketIdx].includes(normalizedWord);
  const hashEnd = performance.now();
  const hashIndexTime = (hashEnd - hashStart) / 1000; // convert ms to seconds

  // Table scan search
  const scanStart = performance.now();
  let foundInScan = false;
  for (let i = 0; i < allWords.length; i++) {
    if (allWords[i] === normalizedWord) {
      foundInScan = true;
      break;
    }
  }
  const scanEnd = performance.now();
  const tableScanTime = (scanEnd - scanStart) / 1000;

  // Avoid division by zero
  const timeReduction = tableScanTime > 0
    ? ((tableScanTime - hashIndexTime) / tableScanTime) * 100
    : 0;

  const speedup = hashIndexTime > 0
    ? tableScanTime / hashIndexTime
    : 0;

  const pageIndex = Math.floor(bucketIdx / bucketsPerPage);

  return {
    found: foundInHash || foundInScan,
    word: normalizedWord,
    hashIndexTime,
    tableScanTime,
    timeReduction,
    speedup,
    bucketIndex: bucketIdx,
    pageIndex,
  };
}