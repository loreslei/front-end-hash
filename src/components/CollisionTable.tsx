import { useState, useMemo, memo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
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

interface CollisionTableProps {
  pages: PageData[];
}

const CollisionRow = memo(({ bucket }: { bucket: { index: number; words: string[]; collisionCount: number } }) => (
  <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
    <td className="px-3 py-2 font-mono text-xs">
      <span
        className="inline-flex items-center justify-center min-w-[2rem] h-5 rounded text-[10px] font-bold"
        style={{
          backgroundColor: HASH_COLORS[bucket.index % HASH_COLORS.length] + "22",
          color: HASH_COLORS[bucket.index % HASH_COLORS.length],
        }}
      >
        {bucket.index}
      </span>
    </td>
    <td className="px-3 py-2 font-mono text-xs">
      <span className="font-bold" style={{ color: HASH_COLORS[4] }}>{bucket.collisionCount}</span>
    </td>
    <td className="px-3 py-2">
      <div className="flex flex-wrap gap-1">
        {bucket.words.map((w, i) => (
          <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-xs font-mono">
            {w}
          </span>
        ))}
      </div>
    </td>
  </tr>
));
CollisionRow.displayName = "CollisionRow";

export function CollisionTable({ pages }: CollisionTableProps) {
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));
  const [pageOffset, setPageOffset] = useState(0);

  // Filter only pages that have collisions
  const pagesWithCollisions = useMemo(() =>
    pages.filter(p => p.totalCollisions > 0),
    [pages]
  );

  const PAGES_PER_VIEW = 5;
  const visiblePages = pagesWithCollisions.slice(pageOffset, pageOffset + PAGES_PER_VIEW);

  const togglePage = (idx: number) => {
    setExpandedPages(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  if (pagesWithCollisions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhuma colisão encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visiblePages.map((page) => {
        const isExpanded = expandedPages.has(page.pageIndex);
        const collisionBuckets = page.buckets.filter(b => b.collisionCount > 0);
        return (
          <div key={page.pageIndex} className="rounded-lg border">
            <button
              onClick={() => togglePage(page.pageIndex)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 rounded-t-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" style={{ color: HASH_COLORS[4] }} />
                <span className="text-sm font-display font-bold text-foreground">
                  Página {page.pageIndex + 1}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({page.totalCollisions} colisões em {collisionBuckets.length} buckets)
                </span>
              </div>
              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-3 py-2 text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider w-20">Bucket</th>
                      <th className="px-3 py-2 text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider w-20">Colisões</th>
                      <th className="px-3 py-2 text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider">Palavras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collisionBuckets.map(bucket => (
                      <CollisionRow key={bucket.index} bucket={bucket} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {pagesWithCollisions.length > PAGES_PER_VIEW && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground font-mono">
            {pagesWithCollisions.length} páginas com colisões
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={pageOffset === 0} onClick={() => setPageOffset(p => p - PAGES_PER_VIEW)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono px-2 text-muted-foreground">
              {pageOffset + 1}–{Math.min(pageOffset + PAGES_PER_VIEW, pagesWithCollisions.length)} / {pagesWithCollisions.length}
            </span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={pageOffset + PAGES_PER_VIEW >= pagesWithCollisions.length} onClick={() => setPageOffset(p => p + PAGES_PER_VIEW)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}