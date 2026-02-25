import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFarm } from '@/store/farmStore';
import { Field } from '@/types/farm';
import { fetchWeatherForCoords } from '@/components/WeatherWidget';
import { Droplets, Loader2, Clock, MapPin, User, FileText } from 'lucide-react';
import type { WeatherData } from '@/components/WeatherWidget';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface SprayModalProps {
  field: Field;
  open: boolean;
  onClose: () => void;
}

export default function SprayModal({ field, open, onClose }: SprayModalProps) {
  const { addSprayRecord, sprayRecipes } = useFarm();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [applicatorName, setApplicatorName] = useState(() => localStorage.getItem('ff_applicator_name') || '');
  const [licenseNumber, setLicenseNumber] = useState(() => localStorage.getItem('ff_license_number') || '');
  const [epaRegNumber, setEpaRegNumber] = useState('');
  const [applicationRate, setApplicationRate] = useState('');
  const [rateUnit, setRateUnit] = useState('oz/ac');
  const [targetPest, setTargetPest] = useState('grass/broadleaves');
  const [sprayDate, setSprayDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Default to now
  });
  const [involvedTechnicians, setInvolvedTechnicians] = useState('');
  const [siteAddress, setSiteAddress] = useState(field.name);
  const [treatedAreaSize, setTreatedAreaSize] = useState(field.acreage.toString());
  const [totalAmountApplied, setTotalAmountApplied] = useState('');
  const [isPremixed, setIsPremixed] = useState(false);

  const selectedRecipe = sprayRecipes.find(r => r.id === selectedRecipeId);

  // Auto-calculate total amount
  useEffect(() => {
    const rate = parseFloat(applicationRate);
    const acres = parseFloat(treatedAreaSize);
    if (!isNaN(rate) && !isNaN(acres)) {
      setTotalAmountApplied((rate * acres).toFixed(1));
    }
  }, [applicationRate, treatedAreaSize]);

  const resetComplianceFields = () => {
    const now = new Date();
    setStartTime(now.toTimeString().slice(0, 5));
    setInvolvedTechnicians('');
    setSiteAddress(field.name);
    setTreatedAreaSize(field.acreage.toString());
    setTargetPest('grass/broadleaves');
    setTotalAmountApplied('');
    setIsPremixed(false);
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchWeatherForCoords(field.lat, field.lng).then(w => {
        setWeather(w);
        setLoading(false);
      });
    }
  }, [open, field.lat, field.lng]);

  const handleRecipeSelect = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const recipe = sprayRecipes.find(r => r.id === recipeId);
    if (recipe) {
      setProduct(recipe.products.map(p => p.product).join(', '));
      if (recipe.products.length === 1) {
        setApplicationRate(recipe.products[0].rate);
        setRateUnit(recipe.products[0].rateUnit);
      } else {
        setApplicationRate(recipe.products.map(p => `${p.rate} ${p.rateUnit}`).join(', '));
        setRateUnit('');
      }
      if (recipe.applicatorName) setApplicatorName(recipe.applicatorName);
      if (recipe.licenseNumber) setLicenseNumber(recipe.licenseNumber);
      if (recipe.epaRegNumber) setEpaRegNumber(recipe.epaRegNumber);
      if (recipe.targetPest) setTargetPest(recipe.targetPest);
    }
  };

  const handleSubmit = () => {
    if (!product.trim() || !weather) return;
    if (applicatorName.trim()) localStorage.setItem('ff_applicator_name', applicatorName.trim());
    if (licenseNumber.trim()) localStorage.setItem('ff_license_number', licenseNumber.trim());
    addSprayRecord({
      fieldId: field.id,
      fieldName: field.name,
      product: product.trim(),
      windSpeed: weather.wind,
      temperature: weather.temp,
      applicatorName: applicatorName.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      epaRegNumber: epaRegNumber.trim() || undefined,
      applicationRate: applicationRate.trim() || undefined,
      rateUnit: rateUnit || undefined,
      targetPest: targetPest.trim() || undefined,
      windDirection: weather.windDirection,
      relativeHumidity: weather.humidity,
      sprayDate: sprayDate || undefined,
      // Regulatory fields
      startTime: startTime || undefined,
      involvedTechnicians: involvedTechnicians.trim() || undefined,
      siteAddress: siteAddress.trim() || undefined,
      treatedAreaSize: treatedAreaSize.trim() || undefined,
      totalAmountApplied: totalAmountApplied.trim() || undefined,
      isPremixed,
    });
    setProduct('');
    setSelectedRecipeId('');
    setApplicatorName('');
    setLicenseNumber('');
    setEpaRegNumber('');
    setApplicationRate('');
    setTargetPest('');
    resetComplianceFields();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-spray/30 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-spray font-bold">
            <Droplets size={20} />
            Spray Application — {field.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Main Info */}
          <div className="space-y-3">
            {sprayRecipes.length > 0 && (
              <div>
                <Label className="text-muted-foreground font-mono text-xs">SELECT RECIPE</Label>
                <Select value={selectedRecipeId} onValueChange={handleRecipeSelect}>
                  <SelectTrigger className="mt-1 bg-muted border-border text-foreground">
                    <SelectValue placeholder="Recipe (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprayRecipes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground font-mono text-xs font-bold">TRADE NAME(S) *</Label>
              <Input
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="e.g. Roundup PowerMAX"
                className="mt-1 bg-muted border-border text-foreground focus:ring-spray"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground font-mono text-xs">EPA REG #</Label>
                <Input value={epaRegNumber} onChange={e => setEpaRegNumber(e.target.value)} placeholder="524-549" className="mt-1 bg-muted border-border text-foreground" />
              </div>
              <div>
                <Label className="text-muted-foreground font-mono text-xs font-bold">DATE</Label>
                <Input type="date" value={sprayDate} onChange={e => setSprayDate(e.target.value)} className="mt-1 bg-muted border-border text-foreground" />
              </div>
            </div>
          </div>

          {/* Compliance Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="compliance" className="border-spray/20">
              <AccordionTrigger className="text-spray font-mono text-xs font-bold hover:no-underline py-2">
                REGULATORY COMPLIANCE DETAILS (2 CSR 70-25.120)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* 1. Timing */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    <Clock size={12} /> Timing
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground">START TIME</Label>
                    <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-0.5 bg-muted border-border text-foreground h-9" />
                  </div>
                </div>

                {/* 2. Site */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    <MapPin size={12} /> Site Details
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-1">
                      <Label className="text-[10px] font-mono text-muted-foreground">SITE DESCRIPTION / ADDR</Label>
                      <Input value={siteAddress} onChange={e => setSiteAddress(e.target.value)} placeholder="Field name or addr" className="mt-0.5 bg-muted border-border text-foreground h-9" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">TREATED AREA SIZE</Label>
                      <Input value={treatedAreaSize} onChange={e => setTreatedAreaSize(e.target.value)} placeholder="e.g. 80 ac" className="mt-0.5 bg-muted border-border text-foreground h-9" />
                    </div>
                  </div>
                </div>

                {/* 3. Use Specifics */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    <FileText size={12} /> Use Specifics
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">APP RATE</Label>
                      <div className="flex gap-1">
                        <Input value={applicationRate} onChange={e => setApplicationRate(e.target.value)} placeholder="22" className="mt-0.5 bg-muted border-border text-foreground h-9 flex-1" />
                        <Input value={rateUnit} onChange={e => setRateUnit(e.target.value)} placeholder="oz/ac" className="mt-0.5 bg-muted border-border text-foreground h-9 w-16" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">TOTAL AMOUNT (CALC)</Label>
                      <Input value={totalAmountApplied} onChange={e => setTotalAmountApplied(e.target.value)} placeholder="Auto-calculated" className="mt-0.5 bg-muted border-border text-foreground h-9 font-bold" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground">TARGET PEST(S)</Label>
                    <Input value={targetPest} onChange={e => setTargetPest(e.target.value)} placeholder="e.g. Pigweed" className="mt-0.5 bg-muted border-border text-foreground h-9" />
                  </div>
                  <div className="flex items-center space-x-2 py-2">
                    <Switch id="premixed" checked={isPremixed} onCheckedChange={setIsPremixed} />
                    <Label htmlFor="premixed" className="text-xs font-mono text-muted-foreground">PREMIXED PRODUCT</Label>
                  </div>
                </div>

                {/* 4. Applicators */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">
                    <User size={12} /> Applicators
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">CERT. APPLICATOR</Label>
                      <Input value={applicatorName} onChange={e => setApplicatorName(e.target.value)} className="mt-0.5 bg-muted border-border text-foreground h-9" />
                    </div>
                    <div>
                      <Label className="text-[10px] font-mono text-muted-foreground">LICENSE #</Label>
                      <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="mt-0.5 bg-muted border-border text-foreground h-9" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-mono text-muted-foreground">INVOLVED TECHNICIANS / NON-CERTIFIED</Label>
                    <Input value={involvedTechnicians} onChange={e => setInvolvedTechnicians(e.target.value)} placeholder="Name and license of others involved" className="mt-0.5 bg-muted border-border text-foreground h-9" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Weather (Auto-filled) */}
          <div className="rounded-lg border border-spray/20 bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-spray font-mono text-[10px] font-bold uppercase tracking-wider">Environmental Conditions (Auto-filled)</span>
              {loading && <Loader2 size={12} className="text-spray animate-spin" />}
            </div>
            {weather && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase">Wind</div>
                  <div className="text-xs font-mono font-bold">{weather.wind} mph {weather.windDirection}</div>
                </div>
                <div className="space-y-0.5 border-l border-border/50 pl-2">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase">Temp</div>
                  <div className="text-xs font-mono font-bold">{weather.temp}°F</div>
                </div>
                <div className="space-y-0.5 border-l border-border/50 pl-2">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase">Humidity</div>
                  <div className="text-xs font-mono font-bold">{weather.humidity}%</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="sticky bottom-0 bg-card pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!product.trim() || !weather || loading}
            className="touch-target w-full bg-spray text-white hover:bg-spray/90 glow-spray font-bold py-6 text-base"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Complete Regulatory Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

