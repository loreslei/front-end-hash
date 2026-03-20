import { useState, useCallback } from "react";
import { HashConfig } from "@/components/HashConfig";
import { WordSearch } from "@/components/WordSearch";
import { PagedHashTable } from "@/components/PagedHashTable";
import { CollisionTable } from "@/components/CollisionTable";
// Importamos as funções que batem na API
import { initializeDatabase, fetchHashTableStructure, searchWordApi, type SearchResult, type PageData } from "@/lib/search";
import type { HashFunction } from "@/lib/hash";
import { Hash, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// A lista de palavras agora será carregada do arquivo txt lá no backend, 
// mas podemos deixar algumas de exemplo para a UI de busca autocompletar.
const WORDS_SUGGESTIONS = ["zoist", "1080"];

const Index = () => {
  const { toast } = useToast();
  const [hashFn, setHashFn] = useState<HashFunction>("djb2");
  const [totalBuckets, setTotalBuckets] = useState(10);
  const [bucketsPerPage, setBucketsPerPage] = useState(5);
  
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchHighlightPage, setSearchHighlightPage] = useState<number | null>(null);
  
  // Novo estado para guardar as páginas que vieram da API
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função disparada ao clicar no botão "Inicializar Banco"
  const handleInitialize = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Inicializa no backend
      await initializeDatabase(bucketsPerPage, totalBuckets);
      
      // 2. Busca a estrutura física (como os buckets ficaram)
      const dataPages = await fetchHashTableStructure(bucketsPerPage);
      setPages(dataPages);
      
      setIsInitialized(true);
      setHighlightIndex(null);
      setSearchHighlightPage(null);
      
      toast({ title: "Sucesso!", description: "Banco de dados inicializado na memória." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Verifique se o backend Python está rodando." });
    } finally {
      setIsLoading(false);
    }
  }, [bucketsPerPage, totalBuckets, toast]);

  // Função para lidar com o resultado vindo do componente WordSearch
  const handleSearchResult = useCallback((result: SearchResult) => {
    if (result.found && result.bucketIndex !== undefined) {
      setHighlightIndex(result.bucketIndex);
      setSearchHighlightPage(result.pageIndex ?? null);
    } else {
      setHighlightIndex(null);
      setSearchHighlightPage(null);
      toast({ variant: "destructive", title: "Não encontrada", description: "A chave não está no banco." });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        {/* ... (Seu header original continua igual) ... */}
        <div className="container max-w-7xl mx-auto flex items-center gap-3 py-4 px-4">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Hash className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground tracking-tight">
              Índice Hash Dinâmico
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Comparativo entre buscas com índice hash dinâmico e table scan
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                onTotalBucketsChange={setTotalBuckets} // Envia para o backend como bucket_capacity
                onBucketsPerPageChange={setBucketsPerPage} // Envia como tuples_per_page
                onInitialize={handleInitialize}
                isInitialized={isInitialized}
              />
              {isLoading && <p className="text-xs text-indigo-600">Conectando ao banco...</p>}
            </div>

            {isInitialized && (
              <div className="bg-card border rounded-xl p-4 space-y-3">
                <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Busca por Palavra
                </h2>
                {/* Aqui nós passamos a nova função de busca da API para o componente filho */}
                <WordSearch
                  words={WORDS_SUGGESTIONS}
                  hashFn={hashFn}
                  totalBuckets={totalBuckets}
                  bucketsPerPage={bucketsPerPage}
                  onSearchResult={handleSearchResult}
                  customSearchApi={searchWordApi} 
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Tabela Hash Visual [{totalBuckets} capacidade]
              </h2>
              <PagedHashTable
                pages={pages}
                highlightIndex={highlightIndex}
                onHighlightIndex={setHighlightIndex}
                highlightPageIndex={searchHighlightPage}
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-bold font-display text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Análise de Colisões
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