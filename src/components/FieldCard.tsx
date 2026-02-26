import { useState, useEffect } from 'react';
import { Field } from '@/types/farm';
import PlantModal from '@/components/PlantModal';
import SprayModal from '@/components/SprayModal';
import HarvestModal from '@/components/HarvestModal';
import { Sprout, Droplets, Wheat, MapPin, CloudRain, Loader2, Tractor } from 'lucide-react';
import HayModal from '@/components/HayModal';

interface FieldCardProps {
  field: Field;
  rain24h?: number | null;
  rainLoading?: boolean;
}

export default function FieldCard({ field, rain24h, rainLoading }: FieldCardProps) {
  const [modal, setModal] = useState<'plant' | 'spray' | 'harvest' | 'hay' | null>(null);

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-foreground">{field.name}</h3>
            <div className="flex items-center gap-1 text-muted-foreground font-mono text-xs mt-0.5">
              <MapPin size={12} />
              {field.acreage} ac
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-sm">
            {rainLoading ? (
              <Loader2 size={14} className="text-spray animate-spin" />
            ) : rain24h != null ? (
              <span className={`flex items-center gap-1 ${rain24h > 0 ? 'text-spray' : 'text-muted-foreground'}`}>
                <CloudRain size={14} />
                {rain24h > 0 ? `${rain24h.toFixed(2)}"` : '0.00"'}
                <span className="text-[10px] text-muted-foreground">24h</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setModal('plant')}
            className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-lg bg-plant/10 border border-plant/20 hover:bg-plant/20 text-plant transition-all active:scale-95 py-3"
          >
            <Sprout size={20} strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase font-bold">Plant</span>
          </button>
          <button
            onClick={() => setModal('spray')}
            className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-lg bg-spray/10 border border-spray/20 hover:bg-spray/20 text-spray transition-all active:scale-95 py-3"
          >
            <Droplets size={20} strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase font-bold">Spray</span>
          </button>
          <button
            onClick={() => setModal('harvest')}
            className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-lg bg-harvest/10 border border-harvest/20 hover:bg-harvest/20 text-harvest transition-all active:scale-95 py-3"
          >
            <Wheat size={20} strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase font-bold">Grain</span>
          </button>
          <button
            onClick={() => setModal('hay')}
            className="touch-target flex flex-col items-center justify-center gap-1.5 rounded-lg bg-harvest/10 border border-harvest/20 hover:bg-harvest/20 text-harvest transition-all active:scale-95 py-3"
          >
            <Tractor size={20} strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase font-bold">Hay</span>
          </button>
        </div>
      </div>

      <PlantModal field={field} open={modal === 'plant'} onClose={() => setModal(null)} />
      <SprayModal field={field} open={modal === 'spray'} onClose={() => setModal(null)} />
      <HarvestModal field={field} open={modal === 'harvest'} onClose={() => setModal(null)} />
      <HayModal field={field} open={modal === 'hay'} onClose={() => setModal(null)} />
    </>
  );
}
