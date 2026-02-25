import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFarm } from '@/store/farmStore';
import { Field } from '@/types/farm';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FieldManageModalProps {
  open: boolean;
  onClose: () => void;
  editField?: Field | null;
}

export default function FieldManageModal({ open, onClose, editField }: FieldManageModalProps) {
  const { addField, updateField } = useFarm();
  const [name, setName] = useState(editField?.name || '');
  const [acreage, setAcreage] = useState(editField?.acreage?.toString() || '');
  const [lat, setLat] = useState(editField?.lat?.toString() || '');
  const [lng, setLng] = useState(editField?.lng?.toString() || '');
  const [fsaFarm, setFsaFarm] = useState(editField?.fsaFarmNumber || '');
  const [fsaTract, setFsaTract] = useState(editField?.fsaTractNumber || '');

  const isEdit = !!editField;

  const handleSubmit = () => {
    const ac = parseFloat(acreage);
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!name.trim() || isNaN(ac) || isNaN(la) || isNaN(ln)) return;

    const fieldData = {
      name: name.trim(),
      acreage: ac,
      lat: la,
      lng: ln,
      fsaFarmNumber: fsaFarm.trim() || undefined,
      fsaTractNumber: fsaTract.trim() || undefined
    };

    if (isEdit) {
      updateField({ id: editField.id, ...fieldData });
    } else {
      addField(fieldData);
    }
    onClose();
  };

  const valid = name.trim() && acreage && lat && lng;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-primary/30 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            {isEdit ? <Pencil size={20} /> : <Plus size={20} />}
            {isEdit ? 'Edit Field' : 'Add Field'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-muted-foreground font-mono text-xs">FIELD NAME</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. North 80"
              className="mt-1 bg-muted border-border text-foreground"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-muted-foreground font-mono text-xs">ACREAGE</Label>
            <Input
              type="number"
              value={acreage}
              onChange={e => setAcreage(e.target.value)}
              placeholder="0"
              className="mt-1 bg-muted border-border text-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground font-mono text-xs flex items-center gap-1">
                <MapPin size={10} /> LATITUDE
              </Label>
              <Input
                type="number"
                step="0.001"
                value={lat}
                onChange={e => setLat(e.target.value)}
                placeholder="41.88"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground font-mono text-xs flex items-center gap-1">
                <MapPin size={10} /> LONGITUDE
              </Label>
              <Input
                type="number"
                step="0.001"
                value={lng}
                onChange={e => setLng(e.target.value)}
                placeholder="-93.09"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-2">
            <div>
              <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">FSA Farm #</Label>
              <Input
                value={fsaFarm}
                onChange={e => setFsaFarm(e.target.value)}
                placeholder="1234"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-muted-foreground font-mono text-xs uppercase tracking-wider">FSA Tract #</Label>
              <Input
                value={fsaTract}
                onChange={e => setFsaTract(e.target.value)}
                placeholder="5678"
                className="mt-1 bg-muted border-border text-foreground"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!valid}
            className="touch-target w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-plant font-bold"
          >
            {isEdit ? 'Save Changes' : 'Add Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Standalone field list management component
export function FieldManager() {
  const { fields, deleteField } = useFarm();
  const [editField, setEditField] = useState<Field | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setAddOpen(true)}
          className="touch-target w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary rounded-lg py-3 font-mono text-sm font-bold active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Add New Field
        </button>

        {fields.map(field => (
          <div key={field.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-foreground text-sm">{field.name}</span>
              <div className="text-xs font-mono text-muted-foreground mt-0.5">
                {field.acreage} ac · {field.lat.toFixed(3)}, {field.lng.toFixed(3)}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setEditField(field)}
                className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteConfirm(field.id)}
                className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {addOpen && (
        <FieldManageModal open onClose={() => setAddOpen(false)} />
      )}
      {editField && (
        <FieldManageModal open editField={editField} onClose={() => setEditField(null)} />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-destructive/30 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Field</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove this field. Existing records will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-target border-border text-muted-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteConfirm) deleteField(deleteConfirm); setDeleteConfirm(null); }}
              className="touch-target bg-destructive text-destructive-foreground glow-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
