import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFarm } from '@/store/farmStore';
import { Field } from '@/types/farm';
import { Sprout } from 'lucide-react';

interface PlantModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
}

export default function PlantModal({ field, open, onClose }: PlantModalProps) {
  const { addPlantRecord, savedSeeds } = useFarm();
  const [seedVariety, setSeedVariety] = useState('');
  const [crop, setCrop] = useState('');
  const [fsaFarm, setFsaFarm] = useState('');
  const [fsaTract, setFsaTract] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [plantDate, setPlantDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!seedVariety.trim()) return;
    addPlantRecord({
      fieldId: field.id,
      fieldName: field.name,
      seedVariety: seedVariety.trim(),
      acreage: field.acreage,
      crop: crop.trim() || undefined,
      fsaFarmNumber: fsaFarm.trim() || undefined,
      fsaTractNumber: fsaTract.trim() || undefined,
      intendedUse: intendedUse.trim() || undefined,
      plantDate: plantDate || undefined,
    });
    setSeedVariety('');
    setCrop('');
    setFsaFarm('');
    setFsaTract('');
    setIntendedUse('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-plant/30 max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-plant">
            <Sprout size={20} />
            Plant — {field.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground font-mono text-xs">SEED VARIETY *</Label>
            {savedSeeds.length > 0 ? (
              <Select value={seedVariety} onValueChange={setSeedVariety}>
                <SelectTrigger className="mt-1 bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select a seed variety" />
                </SelectTrigger>
                <SelectContent>
                  {savedSeeds.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={seedVariety}
                onChange={e => setSeedVariety(e.target.value)}
                placeholder="e.g. DKC 64-35 (add seeds in Setup)"
                className="mt-1 bg-muted border-border text-foreground"
                autoFocus
              />
            )}
          </div>
          <div>
            <Label className="text-muted-foreground font-mono text-xs">CROP TYPE</Label>
            <Input
              value={crop}
              onChange={e => setCrop(e.target.value)}
              placeholder="e.g. Corn, Soybeans"
              className="mt-1 bg-muted border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-muted-foreground font-mono text-xs">PLANT DATE</Label>
            <Input
              type="date"
              value={plantDate}
              onChange={e => setPlantDate(e.target.value)}
              className="mt-1 bg-muted border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground font-mono text-xs">FSA FARM #</Label>
              <Input
                value={fsaFarm}
                onChange={e => setFsaFarm(e.target.value)}
                placeholder="e.g. 1234"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground font-mono text-xs">FSA TRACT #</Label>
              <Input
                value={fsaTract}
                onChange={e => setFsaTract(e.target.value)}
                placeholder="e.g. 5678"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground font-mono text-xs">INTENDED USE</Label>
            <Input
              value={intendedUse}
              onChange={e => setIntendedUse(e.target.value)}
              placeholder="e.g. Grain, Silage, Cover"
              className="mt-1 bg-muted border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-muted-foreground font-mono text-xs">ACREAGE</Label>
            <div className="mt-1 px-3 py-2 bg-muted rounded-md font-mono text-foreground">
              {field.acreage} ac
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!seedVariety.trim()}
            className="touch-target w-full bg-plant text-plant-foreground hover:bg-plant/90 glow-plant font-bold"
          >
            Log Planting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
