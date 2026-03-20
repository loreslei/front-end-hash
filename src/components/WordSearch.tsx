import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, XCircle, Zap, Timer, TrendingDown, Gauge } from "lucide-react";
import { searchWord, type SearchResult } from "@/lib/search";
import type { HashFunction } from "@/lib/hash";

interface WordSearchProps {
  words: string[];
  hashFn: HashFunction;
  totalBuckets: number;
  bucketsPerPage: number;
  onSearchResult?: (result: SearchResult) => void;
}

export function WordSearch({ words, hashFn, totalBuckets, bucketsPerPage, onSearchResult }: WordSearchProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    if (!query.trim() || words.length === 0) return;
    setIsSearching(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const res = searchWord(query, words, hashFn, totalBuckets, bucketsPerPage);
      setResult(res);
      onSearchResult?.(res);
      setIsSearching(false);
    }, 50);
  }, [query, words, hashFn, totalBuckets, bucketsPerPage, onSearchResult]);

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
          disabled={!query.trim() || isSearching || words.length === 0}
          className="gap-2 hidden"
          size="sm"
        >
          <Search className="h-4 w-4" />
          Buscar
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
              Bucket: [{result.bucketIndex}] • Página: {(result.pageIndex ?? 0) + 1}
            </p>
          )}

          {/* Timing metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Índice Hash (s)
              </div>
              <p className="font-bold font-mono text-foreground">
                {result.hashIndexTime.toFixed(6)}
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Table Scan (s)
              </div>
              <p className="font-bold font-mono text-foreground">
                {result.tableScanTime.toFixed(6)}
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Redução Tmp
              </div>
              <p className="font-bold font-mono text-foreground">
                {result.timeReduction.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-display">
                Rapidez
              </div>
              <p className="font-bold font-mono text-foreground">
                {result.speedup.toFixed(2)}x
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}