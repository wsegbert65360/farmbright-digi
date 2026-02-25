import { useState, useMemo } from 'react';
import { useFarm } from '@/store/farmStore';
import BottomNav from '@/components/BottomNav';
import { ClipboardList, Sprout, Droplets, Wheat, Trash2, Warehouse } from 'lucide-react';
import { formatDate } from '@/config/constants';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Tab = 'plant' | 'spray' | 'harvest' | 'grain';

const TABS: { key: Tab; icon: any; label: string; color: string }[] = [
  { key: 'plant', icon: Sprout, label: 'Plant', color: 'text-plant' },
  { key: 'spray', icon: Droplets, label: 'Spray', color: 'text-spray' },
  { key: 'harvest', icon: Wheat, label: 'Harvest', color: 'text-harvest' },
  { key: 'grain', icon: Warehouse, label: 'Grain', color: 'text-harvest' },
];

export default function Activity() {
  const { plantRecords, sprayRecords, harvestRecords, grainMovements, deletePlantRecords, deleteSprayRecords, deleteHarvestRecords, deleteGrainMovements } = useFarm();
  const [tab, setTab] = useState<Tab>('plant');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    const ids = Array.from(selected);
    if (tab === 'plant') deletePlantRecords(ids);
    else if (tab === 'spray') deleteSprayRecords(ids);
    else if (tab === 'harvest') deleteHarvestRecords(ids);
    else deleteGrainMovements(ids);
    setSelected(new Set());
    setConfirmDelete(false);
  };

  const filteredPlant = useMemo(() =>
    plantRecords
      .filter(r => r.fieldName.toLowerCase().includes(search.toLowerCase()) || r.seedVariety.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp),
    [plantRecords, search]
  );

  const filteredSpray = useMemo(() =>
    sprayRecords
      .filter(r => r.fieldName.toLowerCase().includes(search.toLowerCase()) || r.product.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp),
    [sprayRecords, search]
  );

  const filteredHarvest = useMemo(() =>
    harvestRecords
      .filter(r => r.fieldName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp),
    [harvestRecords, search]
  );

  const filteredGrain = useMemo(() =>
    grainMovements
      .filter(m => m.binName.toLowerCase().includes(search.toLowerCase()) || (m.sourceFieldName || '').toLowerCase().includes(search.toLowerCase()) || (m.destination || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.timestamp - a.timestamp),
    [grainMovements, search]
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Activity</h1>
            <p className="text-xs font-mono text-muted-foreground">REVIEW & MANAGE</p>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelected(new Set()); }}
              className={`flex-1 min-w-[80px] touch-target flex items-center justify-center gap-1.5 rounded-md py-2.5 font-mono text-[10px] font-semibold transition-all ${tab === t.key ? `bg-muted ${t.color}` : 'text-muted-foreground'
                }`}
            >
              <t.icon size={14} />
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search records..."
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />

        {/* Bulk delete */}
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="touch-target w-full flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg py-3 font-mono text-sm font-bold active:scale-95 transition-transform"
          >
            <Trash2 size={18} />
            Delete {selected.size} Record{selected.size > 1 ? 's' : ''}
          </button>
        )}

        {/* Records */}
        <div className="space-y-2">
          {tab === 'plant' && filteredPlant.map(r => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 transition-all ${selected.has(r.id) ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{r.fieldName}</span>
                <span className="text-xs font-mono text-muted-foreground">{formatDate(r.timestamp)}</span>
              </div>
              <div className="text-xs font-mono text-plant mt-1">{r.seedVariety} · {r.acreage} ac</div>
            </button>
          ))}

          {tab === 'spray' && filteredSpray.map(r => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 transition-all ${selected.has(r.id) ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{r.fieldName}</span>
                <span className="text-xs font-mono text-muted-foreground">{formatDate(r.timestamp)}</span>
              </div>
              <div className="text-xs font-mono text-spray mt-1">
                {r.product} · {r.windSpeed}mph · {r.temperature}°F
                {r.startTime && ` · ${r.startTime}`}
              </div>
            </button>
          ))}

          {tab === 'harvest' && filteredHarvest.map(r => (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 transition-all ${selected.has(r.id) ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{r.fieldName}</span>
                <span className="text-xs font-mono text-muted-foreground">{formatDate(r.timestamp)}</span>
              </div>
              <div className="text-xs font-mono text-harvest mt-1">
                {r.bushels.toLocaleString()} bu → {r.destination === 'bin' ? 'Bin' : 'Town'} · {r.moisturePercent}% M · {r.landlordSplitPercent}% LL
              </div>
            </button>
          ))}

          {tab === 'grain' && filteredGrain.map(m => (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`w-full text-left bg-card border rounded-lg p-3 transition-all ${selected.has(m.id) ? 'border-destructive bg-destructive/5' : 'border-border'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm">{m.binName}</span>
                <span className="text-xs font-mono text-muted-foreground">{formatDate(m.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className={`text-xs font-mono font-bold ${m.type === 'in' ? 'text-plant' : 'text-destructive'}`}>
                  {m.type === 'in' ? '+' : '-'}{m.bushels.toLocaleString()} bu
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {m.sourceFieldName || m.destination || 'Inventory Adjustment'}
                  {m.price && ` · $${m.price}/bu`}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {tab === 'plant' && filteredPlant.length === 0 && <p className="text-center text-muted-foreground font-mono text-sm py-8">No planting records</p>}
        {tab === 'spray' && filteredSpray.length === 0 && <p className="text-center text-muted-foreground font-mono text-sm py-8">No spray records</p>}
        {tab === 'harvest' && filteredHarvest.length === 0 && <p className="text-center text-muted-foreground font-mono text-sm py-8">No harvest records</p>}
        {tab === 'grain' && filteredGrain.length === 0 && <p className="text-center text-muted-foreground font-mono text-sm py-8">No grain movement records</p>}
      </main>

      {/* Confirm Delete Dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="bg-card border-destructive/30 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove {selected.size} record{selected.size > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="touch-target bg-destructive text-destructive-foreground glow-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
