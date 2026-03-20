import { useState, useMemo, useCallback } from "react";
import { HashConfig } from "@/components/HashConfig";
import { WordSearch } from "@/components/WordSearch";
import { PagedHashTable } from "@/components/PagedHashTable";
import { CollisionTable } from "@/components/CollisionTable";
import { buildPagedHashTable, type SearchResult } from "@/lib/search";
import type { HashFunction } from "@/lib/hash";
import { Hash, Search, AlertTriangle } from "lucide-react";

const WORDS = [
  "algoritmo", "hash", "tabela", "busca", "índice", "colisão", "chave", "valor",
  "estrutura", "dados", "árvore", "grafo", "pilha", "fila", "lista", "nó",
  "ponteiro", "memória", "alocação", "recursão", "iteração", "complexidade",
  "ordenação", "inserção", "remoção", "balanceamento", "dispersão", "encadeamento",
  "sondagem", "bucket", "função", "módulo", "primo", "overflow", "underflow",
  "binário", "linear", "logarítmico", "quadrático", "exponencial", "constante",
  "vetor", "matriz", "string", "caractere", "compilador", "interpretador",
  "paradigma", "abstração", "herança", "polimorfismo"
];

const Index = () => {
  const [hashFn, setHashFn] = useState<HashFunction>("djb2");
  const [totalBuckets, setTotalBuckets] = useState(10);
  const [bucketsPerPage, setBucketsPerPage] = useState(5);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchHighlightPage, setSearchHighlightPage] = useState<number | null>(null);

  const pages = useMemo(() => {
    if (!isInitialized) return [];
    return buildPagedHashTable(WORDS, hashFn, totalBuckets, bucketsPerPage);
  }, [isInitialized, hashFn, totalBuckets, bucketsPerPage]);

  const handleInitialize = useCallback(() => {
    setIsInitialized(true);
    setHighlightIndex(null);
    setSearchHighlightPage(null);
  }, []);

  const handleSearchResult = useCallback((result: SearchResult) => {
    if (result.found && result.bucketIndex !== undefined) {
      setHighlightIndex(result.bucketIndex);
      setSearchHighlightPage(result.pageIndex ?? null);
    } else {
      setHighlightIndex(null);
      setSearchHighlightPage(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container max-w-7xl mx-auto flex items-center gap-3 py-4 px-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Hash className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground tracking-tight">
              Índice Hash Dinâmico
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Paginação de palavras com funções de dispersão
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar: Config + Search */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-card border rounded-xl p-4 space-y-4">
              <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Configuração
              </h2>
              <HashConfig
                hashFn={hashFn}
                totalBuckets={totalBuckets}
                bucketsPerPage={bucketsPerPage}
                onHashFnChange={setHashFn}
                onTotalBucketsChange={setTotalBuckets}
                onBucketsPerPageChange={setBucketsPerPage}
                onInitialize={handleInitialize}
                isInitialized={isInitialized}
              />
            </div>

            {isInitialized && (
              <div className="bg-card border rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Busca por Palavra
                </h2>
                <WordSearch
                  words={WORDS}
                  hashFn={hashFn}
                  totalBuckets={totalBuckets}
                  bucketsPerPage={bucketsPerPage}
                  onSearchResult={handleSearchResult}
                />
              </div>
            )}
          </div>

          {/* Main: Hash Table (paged) */}
          <div className="lg:col-span-5">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Tabela Hash [{totalBuckets} buckets · {Math.ceil(totalBuckets / bucketsPerPage)} páginas]
              </h2>
              <PagedHashTable
                pages={pages}
                highlightIndex={highlightIndex}
                onHighlightIndex={setHighlightIndex}
                highlightPageIndex={searchHighlightPage}
              />
            </div>
          </div>

          {/* Right: Collision Table (paged) */}
          <div className="lg:col-span-4">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" style={{ color: "hsl(var(--hash-4))" }} />
                Colisões por Página
              </h2>
              <CollisionTable pages={pages} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;