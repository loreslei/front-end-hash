import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { searchWordApi, type SearchResult } from "@/lib/search";
import type { HashFunction } from "@/lib/hash";

const HASH_COLORS = [
  "hsl(var(--hash-0))",
  "hsl(var(--hash-1))",
  "hsl(var(--hash-2))",
  "hsl(var(--hash-3))",
  "hsl(var(--hash-4))",
  "hsl(var(--hash-5))",
  "hsl(var(--hash-6))",
  "hsl(var(--hash-7))",
];

interface WordSearchProps {
  words: string[];
  hashFn: HashFunction;
  totalBuckets: number;
  bucketsPerPage: number;
  onSearchResult?: (result: SearchResult) => void;
  // Adicionamos esta propriedade opcional caso você queira passar a função pelo Index.tsx
  customSearchApi?: (word: string) => Promise<SearchResult>; 
}

export function WordSearch({ onSearchResult, customSearchApi }: WordSearchProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Alteramos handleSearch para ser assíncrono (async) e bater na API
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null); // Limpa o resultado anterior enquanto busca
    
    try {
      // Usa a API customizada passada pelo pai, ou importa direto de lib/search
      const searchFn = customSearchApi || searchWordApi;
      const res = await searchFn(query);
      
      setResult(res);
      onSearchResult?.(res);
    } catch (error) {
      console.error("Erro ao buscar palavra na API:", error);
      // Aqui você poderia adicionar um Toast avisando que a API falhou
    } finally {
      setIsSearching(false);
    }
  }, [query, customSearchApi, onSearchResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar palavra..."
            className="pl-9 font-mono text-sm"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || isSearching}
          className="gap-2 hidden"
          size="sm"
        >
          <Search className="h-4 w-4" />
          {isSearching ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {result && (
        <div className="rounded-lg border bg-card p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Found status */}
          <div className={`flex items-center gap-2 text-sm font-display font-bold ${result.found ? "text-primary" : "text-destructive"}`}>
            {result.found ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                Palavra "{result.word}" encontrada!
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Palavra "{result.word}" não encontrada.
              </>
            )}
          </div>

          {result.found && (
            <p className="text-xs text-muted-foreground font-mono">
              Bucket: <b style={{ color: HASH_COLORS[2] }}>{result.bucketIndex}</b> • Página: <b style={{ color: HASH_COLORS[1] }}  >{result.pageIndex}</b>
            </p>
          )}

          {/* Timing metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1 bg-blue-50/50 border-blue-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Índice Hash (s)
              </div>
              <p className="font-bold font-mono text-blue-600">
                {Number(result.hashIndexTime || 0).toFixed(6)}
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1 bg-orange-50/50 border-orange-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Table Scan (s)
              </div>
              <p className="font-bold font-mono text-orange-600">
                {Number(result.tableScanTime || 0).toFixed(6)}
              </p>
            </div>

            {/* NOVO: Acessos Hash */}
            <div className="rounded-lg border p-3 space-y-1 bg-pink-50/50 border-pink-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Custo Hash
              </div>
              <p className="font-bold font-mono text-pink-500">
                {result.hashAccesses} {result.hashAccesses === 1 ? 'pg' : 'pgs'}
              </p>
            </div>

            {/* NOVO: Acessos Table Scan */}
            <div className="rounded-lg border p-3 space-y-1 bg-rose-50/50 border-rose-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Custo Scan
              </div>
              <p className="font-bold font-mono text-rose-600">
                {result.scanAccesses} {result.scanAccesses === 1 ? 'pg' : 'pgs'}
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1 bg-emerald-50/50 border-emerald-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Redução Tmp
              </div>
              <p className="font-bold font-mono text-emerald-600">
                {Number(result.timeReduction || 0).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1 bg-indigo-50/50 border-indigo-100">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Rapidez
              </div>
              <p className="font-bold font-mono text-indigo-600">
                {Number(result.speedup || 0).toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}