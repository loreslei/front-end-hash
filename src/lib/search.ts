// src/lib/search.ts

// A URL do seu backend local
const API_URL = "https://indice-hash-dinamico.onrender.com";

export interface SearchResult {
  found: boolean;
  word: string;
  hashIndexTime: number;
  tableScanTime: number;
  timeReduction: number;
  speedup: number;
  bucketIndex?: number;
  pageIndex?: number;
  hashAccesses: number; 
  scanAccesses: number; 
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
 * 1. Inicializa o banco no backend
 */
export async function initializeDatabase(tuplesPerPage: number, bucketCapacity: number) {
  const response = await fetch(`${API_URL}/inicializar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tuples_per_page: tuplesPerPage,
      bucket_capacity: bucketCapacity
    })
  });
  
  if (!response.ok) throw new Error("Erro ao inicializar o banco de dados");
  return await response.json();
}

/**
 * 2. Busca a estrutura do backend e adapta para o formato que a UI do Lovable espera
 */
export async function fetchHashTableStructure(bucketsPerPage: number): Promise<PageData[]> {
  const response = await fetch(`${API_URL}/estrutura?detalhado=true`);
  const data = await response.json();
  
  // Pegamos a lista de índices vinda do backend
  const estruturaIndice = data.estrutura_indice || [];
  
  // O frontend do Lovable agrupava buckets por "páginas de buckets" visualmente.
  // Vamos remontar essa estrutura para a interface não quebrar.
  const todosOsBuckets: BucketData[] = [];
  
  estruturaIndice.forEach((idx: any) => {
    idx.detalhes_buckets.forEach((b: any) => {
      // Pega as palavras de dentro dos registros do backend
      const words = b.registros ? b.registros.map((r: any) => r.chave) : [];
      todosOsBuckets.push({
        index: b.id_bucket,
        words: words,
        collisionCount: Math.max(0, words.length - 1)
      });
    });
  });

  // Agrupando para o formato PageData da UI
  const pages: PageData[] = [];
  const totalPages = Math.ceil(todosOsBuckets.length / bucketsPerPage);
  
  for (let p = 0; p < totalPages; p++) {
    const start = p * bucketsPerPage;
    const end = start + bucketsPerPage;
    const bucketsSlice = todosOsBuckets.slice(start, end);
    
    let totalWords = 0;
    let totalCollisions = 0;
    let maxBucketSize = 0;
    let overflows = 0;

    bucketsSlice.forEach(b => {
      totalWords += b.words.length;
      totalCollisions += b.collisionCount;
      maxBucketSize = Math.max(maxBucketSize, b.words.length);
      if (b.words.length > 1) overflows++; // Lógica simples para UI
    });

    pages.push({
      pageIndex: p,
      buckets: bucketsSlice,
      totalWords,
      totalCollisions,
      maxBucketSize,
      overflows
    });
  }

  return pages;
}

/**
 * 3. Faz a busca da palavra no backend
 */
export async function searchWordApi(word: string): Promise<SearchResult> {
  try {
    const response = await fetch(`${API_URL}/buscar/${word}`);
    if (!response.ok) throw new Error("Erro na requisição da API");
    
    const data = await response.json();
    
    const resHash = data.resultados?.indice_hash || {};
    const resScan = data.resultados?.table_scan || {};
    const tempos = data.comparacao_tempo || {};
    
    return {
      found: resHash.encontrado === true, 
      word: data.palavra_buscada || word,
      
      hashIndexTime: tempos.tempo_hash_segundos ?? 0,
      tableScanTime: tempos.tempo_scan_segundos ?? 0,
      timeReduction: tempos.reducao_tempo_pct ?? 0,
      speedup: tempos.ganho_velocidade_x ?? 0,
      
      bucketIndex: resHash.bucket,
      pageIndex: resHash.pagina,

      // NOVO: Buscando o custo exato que o Python calculou
      hashAccesses: resHash.acessos_feitos ?? 0,
      scanAccesses: resScan.custo_paginas_lidas ?? 0
    };
  } catch (error) {
    console.error("Erro no fetch da busca:", error);
    return {
      found: false,
      word: word,
      hashIndexTime: 0,
      tableScanTime: 0,
      timeReduction: 0,
      speedup: 0,
      hashAccesses: 0,
      scanAccesses: 0
    };
  }
}