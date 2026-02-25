import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFarm } from '@/store/farmStore';
import { Field } from '@/types/farm';
import { Wheat, Warehouse, Truck } from 'lucide-react';

interface HarvestModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
}

export default function HarvestModal({ field, open, onClose }: HarvestModalProps) {
  const { addHarvestRecord, addGrainMovement, bins } = useFarm();
  const [destination, setDestination] = useState<'bin' | 'town' | null>(null);
  const [binId, setBinId] = useState('');
  const [moisture, setMoisture] = useState('');
  const [landlordSplit, setLandlordSplit] = useState('');
  const [bushels, setBushels] = useState('');
  const [crop, setCrop] = useState('');
  const [fsaFarm, setFsaFarm] = useState(field.fsaFarmNumber || '');
  const [fsaTract, setFsaTract] = useState(field.fsaTractNumber || '');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);

  const reset = () => {
    setDestination(null);
    setBinId('');
    setMoisture('');
    setLandlordSplit('');
    setBushels('');
    setCrop('');
    setFsaFarm(field.fsaFarmNumber || '');
    setFsaTract(field.fsaTractNumber || '');
  };

  const handleSubmit = () => {
    const m = parseFloat(moisture);
    const ls = parseFloat(landlordSplit);
    const bu = parseFloat(bushels);
    if (isNaN(m) || isNaN(ls) || isNaN(bu) || !destination) return;
    if (destination === 'bin' && !binId) return;

    addHarvestRecord({
      fieldId: field.id,
      fieldName: field.name,
      destination,
      binId: destination === 'bin' ? binId : undefined,
      moisturePercent: m,
      landlordSplitPercent: ls,
      bushels: bu,
      crop: crop.trim() || undefined,
      fsaFarmNumber: fsaFarm.trim() || undefined,
      fsaTractNumber: fsaTract.trim() || undefined,
      harvestDate: harvestDate || undefined,
    });

    if (destination === 'bin') {
      const bin = bins.find(b => b.id === binId);
      addGrainMovement({
        binId,
        binName: bin?.name || 'Unknown',
        type: 'in',
        bushels: bu,
        moisturePercent: m,
        sourceFieldName: field.name,
      });
    }

    reset();
    onClose();
  };

  const valid = destination && moisture && landlordSplit && bushels && (destination === 'town' || binId);

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="bg-card border-harvest/30 max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-harvest">
            <Wheat size={20} />
            Harvest — {field.name}
          </DialogTitle>
        </DialogHeader>

        {!destination ? (
          <div className="space-y-3 py-4">
            <p className="text-muted-foreground font-mono text-xs text-center">SELECT DESTINATION</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setDestination('bin')}
                className="touch-target h-20 flex-col gap-2 bg-muted hover:bg-harvest/20 text-foreground border border-border hover:border-harvest/50"
                variant="outline"
              >
                <Warehouse size={24} />
                <span className="font-mono text-sm">Bin</span>
              </Button>
              <Button
                onClick={() => setDestination('town')}
                className="touch-target h-20 flex-col gap-2 bg-muted hover:bg-harvest/20 text-foreground border border-border hover:border-harvest/50"
                variant="outline"
              >
                <Truck size={24} />
                <span className="font-mono text-sm">Town</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {destination === 'bin' && (
              <div>
                <Label className="text-muted-foreground font-mono text-xs">SELECT BIN</Label>
                <Select value={binId} onValueChange={setBinId}>
                  <SelectTrigger className="mt-1 bg-muted border-border">
                    <SelectValue placeholder="Choose bin..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {bins.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              <Label className="text-muted-foreground font-mono text-xs">HARVEST DATE</Label>
              <Input
                type="date"
                value={harvestDate}
                onChange={e => setHarvestDate(e.target.value)}
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground font-mono text-xs">BUSHELS</Label>
              <Input
                type="number"
                value={bushels}
                onChange={e => setBushels(e.target.value)}
                placeholder="0"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground font-mono text-xs">MOISTURE %</Label>
                <Input
                  type="number"
                  value={moisture}
                  onChange={e => setMoisture(e.target.value)}
                  placeholder="0.0"
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-muted-foreground font-mono text-xs">LANDLORD %</Label>
                <Input
                  type="number"
                  value={landlordSplit}
                  onChange={e => setLandlordSplit(e.target.value)}
                  placeholder="0"
                  className="mt-1 bg-muted border-border text-foreground"
                />
              </div>
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
          </div>
        )}

        {destination && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDestination(null)} className="touch-target border-border text-muted-foreground">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!valid}
              className="touch-target flex-1 bg-harvest text-harvest-foreground hover:bg-harvest/90 glow-harvest font-bold"
            >
              Log Harvest
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
