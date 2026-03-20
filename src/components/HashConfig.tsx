import { type HashFunction } from "@/lib/hash";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

interface HashConfigProps {
  hashFn: HashFunction;
  totalBuckets: number;
  bucketsPerPage: number;
  onHashFnChange: (fn: HashFunction) => void;
  onTotalBucketsChange: (size: number) => void;
  onBucketsPerPageChange: (size: number) => void;
  onInitialize: () => void;
  isInitialized: boolean;
}

export function HashConfig({
  totalBuckets,
  bucketsPerPage,
  onTotalBucketsChange,
  onBucketsPerPageChange,
  onInitialize,
  isInitialized,
}: HashConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="font-display text-sm">Tuplas por Página</Label>
        <Input
          type="number"
          min={1}
          max={100000}
          value={totalBuckets}
          onChange={(e) => onTotalBucketsChange(Math.max(1, Math.min(100000, parseInt(e.target.value) || 1)))}
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-display text-sm">Tamanho do Bucket</Label>
        <Input
          type="number"
          min={1}
          max={5000}
          value={bucketsPerPage}
          onChange={(e) => onBucketsPerPageChange(Math.max(1, Math.min(5000, parseInt(e.target.value) || 1)))}
          className="font-mono text-sm"
        />
      </div>
      <Button className="w-full gap-2" onClick={onInitialize}>
        <Database className="h-4 w-4" />
        {isInitialized ? "Reinicializar" : "Inicializar Banco de Dados"}
      </Button>
    </div>
  );
}