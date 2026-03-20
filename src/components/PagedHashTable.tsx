import { useState, useMemo, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageData } from "@/lib/search";

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

interface PagedHashTableProps {
  pages: PageData[];
  highlightIndex: number | null;
  onHighlightIndex: (idx: number | null) => void;
  highlightPageIndex?: number | null;
}

const BucketRow = memo(({ bucket, highlightIndex, onHighlightIndex }: {
  bucket: { index: number; words: string[]; collisionCount: number };
  highlightIndex: number | null;
  onHighlightIndex: (idx: number | null) => void;
}) => (
  <button
    onClick={() => onHighlightIndex(highlightIndex === bucket.index ? null : bucket.index)}
    className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-xs font-mono transition-colors
      ${highlightIndex === bucket.index ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"}
      ${bucket.words.length === 0 ? "opacity-40" : ""}`}
  >
    <span
      className="inline-flex items-center justify-center min-w-[2.5rem] h-5 rounded text-[10px] font-bold shrink-0 mt-0.5"
      style={{
        backgroundColor: HASH_COLORS[bucket.index % HASH_COLORS.length] + "22",
        color: HASH_COLORS[bucket.index % HASH_COLORS.length],
      }}
    >
      {bucket.index}
    </span>
    <div className="flex flex-wrap gap-1 min-h-[20px]">
      {bucket.words.length === 0 ? (
        <span className="text-muted-foreground italic">vazio</span>
      ) : (
        bucket.words.map((w, wi) => (
          <span key={wi} className="inline-block px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
            {w}
          </span>
        ))
      )}
      {bucket.collisionCount > 0 && (
        <span className="text-[10px] px-1 py-0.5 rounded font-bold" style={{ color: HASH_COLORS[4] }}>
          ⚡{bucket.collisionCount} colis{bucket.collisionCount > 1 ? "ões" : "ão"}
        </span>
      )}
    </div>
  </button>
));
BucketRow.displayName = "BucketRow";

export function PagedHashTable({ pages, highlightIndex, onHighlightIndex, highlightPageIndex }: PagedHashTableProps) {
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));

  const totalPages = pages.length;
  const safePage = Math.min(currentPageIdx, totalPages - 1);

  // Global stats
  const globalStats = useMemo(() => {
    let totalWords = 0, totalCollisions = 0, maxBucket = 0, overflows = 0;
    for (const p of pages) {
      totalWords += p.totalWords;
      totalCollisions += p.totalCollisions;
      maxBucket = Math.max(maxBucket, p.maxBucketSize);
      overflows += p.overflows;
    }
    return { totalWords, totalCollisions, maxBucket, overflows };
  }, [pages]);

  const togglePage = useCallback((pageIdx: number) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageIdx)) next.delete(pageIdx);
      else next.add(pageIdx);
      return next;
    });
  }, []);

  // Display pages with pagination (show 5 pages at a time)
  const PAGES_PER_VIEW = 5;
  const startPage = Math.floor(safePage / PAGES_PER_VIEW) * PAGES_PER_VIEW;
  const visiblePages = pages.slice(startPage, startPage + PAGES_PER_VIEW);

  if (pages.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Inicialize o banco de dados para visualizar.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Global stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold font-mono text-primary">{globalStats.totalWords}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Inserções</p>
        </div>
        <div className="bg-card rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold font-mono text-accent-foreground">{globalStats.totalCollisions}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Colisões</p>
        </div>
        <div className="bg-card rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold font-mono text-accent-foreground">
            {globalStats.totalWords > 0 ? ((globalStats.totalCollisions / globalStats.totalWords) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Colisões %</p>
        </div>
        <div className="bg-card rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold font-mono" style={{ color: HASH_COLORS[4] }}>{globalStats.overflows}</p>
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-wider">Overflows</p>
        </div>
      </div>

      {/* Pages */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {visiblePages.map((page) => {
          const isExpanded = expandedPages.has(page.pageIndex);
          const isHighlighted = highlightPageIndex === page.pageIndex;
          return (
            <div
              key={page.pageIndex}
              className={`rounded-lg border transition-colors ${isHighlighted ? "ring-2 ring-primary/40 border-primary/30" : ""}`}
            >
              <button
                onClick={() => togglePage(page.pageIndex)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 rounded-t-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-display font-bold text-foreground">
                    Página {page.pageIndex + 1}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({page.totalWords} palavras · {page.totalCollisions} colisões)
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-2 pb-2 space-y-0.5">
                  {page.buckets.map((bucket) => (
                    <BucketRow
                      key={bucket.index}
                      bucket={bucket}
                      highlightIndex={highlightIndex}
                      onHighlightIndex={onHighlightIndex}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Page navigation */}
      {totalPages > PAGES_PER_VIEW && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground font-mono">
            {totalPages} páginas
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={startPage === 0}
              onClick={() => setCurrentPageIdx(startPage - PAGES_PER_VIEW)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono px-2 text-muted-foreground">
              {startPage + 1}–{Math.min(startPage + PAGES_PER_VIEW, totalPages)} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={startPage + PAGES_PER_VIEW >= totalPages}
              onClick={() => setCurrentPageIdx(startPage + PAGES_PER_VIEW)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}