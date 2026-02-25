import { useState } from 'react';
import { useFarm } from '@/store/farmStore';
import BottomNav from '@/components/BottomNav';
import { FileText, Sprout, Droplets, Wheat, Printer } from 'lucide-react';

type ReportTab = 'fsa-plant' | 'spray-audit' | 'fsa-harvest';

export default function Reports() {
  const { plantRecords, sprayRecords, harvestRecords, fields } = useFarm();
  const [tab, setTab] = useState<ReportTab>('fsa-plant');

  const fmt = (ts: number) => new Date(ts).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const fmtDate = (d?: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '—';

  const tabs: { key: ReportTab; icon: typeof Sprout; label: string; color: string }[] = [
    { key: 'fsa-plant', icon: Sprout, label: 'FSA Plant', color: 'text-plant' },
    { key: 'spray-audit', icon: Droplets, label: 'Spray Audit', color: 'text-spray' },
    { key: 'fsa-harvest', icon: Wheat, label: 'FSA Harvest', color: 'text-harvest' },
  ];

  const handlePrint = () => window.print();

  // Totals
  const totalPlantAcres = plantRecords.reduce((sum, r) => sum + r.acreage, 0);
  const totalHarvestBu = harvestRecords.reduce((sum, r) => sum + r.bushels, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-4 print:bg-background print:border-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center print:hidden">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Reports</h1>
              <p className="text-xs font-mono text-muted-foreground">FSA & COMPLIANCE</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="touch-target flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg text-foreground font-mono text-sm hover:bg-muted/80 transition-colors print:hidden"
          >
            <Printer size={16} />
            Print
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1 print:hidden">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 touch-target flex items-center justify-center gap-1.5 rounded-md py-2.5 font-mono text-sm font-semibold transition-all ${
                tab === t.key ? `bg-muted ${t.color}` : 'text-muted-foreground'
              }`}
            >
              <t.icon size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* FSA Planting Report */}
        {tab === 'fsa-plant' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 print:border-foreground/20">
              <h2 className="font-bold text-foreground text-base mb-1">FSA Planting Report</h2>
              <p className="text-xs font-mono text-muted-foreground mb-4">
                Acreage report for Farm Service Agency certification. Generated {new Date().toLocaleDateString()}.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">DATE</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">FIELD</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">CROP</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">VARIETY</th>
                      <th className="text-right py-2 px-2 font-mono text-xs text-muted-foreground">ACRES</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">FARM #</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">TRACT #</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">USE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plantRecords
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map(r => (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{fmtDate(r.plantDate) || fmt(r.timestamp)}</td>
                          <td className="py-2 px-2 text-foreground font-semibold text-xs">{r.fieldName}</td>
                          <td className="py-2 px-2 font-mono text-xs text-plant">{r.crop || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.seedVariety}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground text-right">{r.acreage}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.fsaFarmNumber || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.fsaTractNumber || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.intendedUse || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-primary/30">
                      <td colSpan={4} className="py-2 px-2 font-mono text-xs font-bold text-foreground">TOTAL</td>
                      <td className="py-2 px-2 font-mono text-xs font-bold text-plant text-right">{totalPlantAcres} ac</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {plantRecords.length === 0 && (
                <p className="text-center text-muted-foreground font-mono text-sm py-8">No planting records to report</p>
              )}
            </div>
          </div>
        )}

        {/* Spray Audit Report */}
        {tab === 'spray-audit' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 print:border-foreground/20">
              <h2 className="font-bold text-foreground text-base mb-1">Pesticide Application Record</h2>
              <p className="text-xs font-mono text-muted-foreground mb-4">
                Private applicator license compliance audit trail. Generated {new Date().toLocaleDateString()}.
              </p>

              {sprayRecords.length === 0 ? (
                <p className="text-center text-muted-foreground font-mono text-sm py-8">No spray records to report</p>
              ) : (
                <div className="space-y-4">
                  {sprayRecords
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map(r => (
                      <div key={r.id} className="border border-border/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-sm">{r.fieldName}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {fmtDate(r.sprayDate) || fmt(r.timestamp)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                          <div><span className="text-muted-foreground">Product:</span> <span className="text-spray">{r.product}</span></div>
                          <div><span className="text-muted-foreground">EPA Reg #:</span> <span className="text-foreground">{r.epaRegNumber || '—'}</span></div>
                          <div><span className="text-muted-foreground">Rate:</span> <span className="text-foreground">{r.applicationRate ? `${r.applicationRate} ${r.rateUnit || ''}` : '—'}</span></div>
                          <div><span className="text-muted-foreground">Target:</span> <span className="text-foreground">{r.targetPest || '—'}</span></div>
                          <div><span className="text-muted-foreground">Applicator:</span> <span className="text-foreground">{r.applicatorName || '—'}</span></div>
                          <div><span className="text-muted-foreground">License #:</span> <span className="text-foreground">{r.licenseNumber || '—'}</span></div>
                          <div><span className="text-muted-foreground">Wind:</span> <span className="text-foreground">{r.windSpeed} mph {r.windDirection || ''}</span></div>
                          <div><span className="text-muted-foreground">Temp:</span> <span className="text-foreground">{r.temperature}°F</span></div>
                          <div><span className="text-muted-foreground">Humidity:</span> <span className="text-foreground">{r.relativeHumidity != null ? `${r.relativeHumidity}%` : '—'}</span></div>
                        </div>
                        {/* Compliance flags */}
                        <div className="flex gap-2 flex-wrap">
                          {r.windSpeed > 15 && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-destructive/20 text-destructive">⚠ HIGH WIND</span>
                          )}
                          {r.temperature > 90 && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-destructive/20 text-destructive">⚠ HIGH TEMP</span>
                          )}
                          {!r.applicatorName && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-harvest/20 text-harvest">△ NO APPLICATOR</span>
                          )}
                          {!r.epaRegNumber && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-harvest/20 text-harvest">△ NO EPA REG</span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FSA Harvest Report */}
        {tab === 'fsa-harvest' && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 print:border-foreground/20">
              <h2 className="font-bold text-foreground text-base mb-1">FSA Production Report</h2>
              <p className="text-xs font-mono text-muted-foreground mb-4">
                Harvest production for FSA yield reporting. Generated {new Date().toLocaleDateString()}.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">DATE</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">FIELD</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">CROP</th>
                      <th className="text-right py-2 px-2 font-mono text-xs text-muted-foreground">BUSHELS</th>
                      <th className="text-right py-2 px-2 font-mono text-xs text-muted-foreground">MOIST %</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">DEST.</th>
                      <th className="text-right py-2 px-2 font-mono text-xs text-muted-foreground">LL %</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">FARM #</th>
                      <th className="text-left py-2 px-2 font-mono text-xs text-muted-foreground">TRACT #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvestRecords
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map(r => (
                        <tr key={r.id} className="border-b border-border/50">
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{fmtDate(r.harvestDate) || fmt(r.timestamp)}</td>
                          <td className="py-2 px-2 text-foreground font-semibold text-xs">{r.fieldName}</td>
                          <td className="py-2 px-2 font-mono text-xs text-harvest">{r.crop || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground text-right">{r.bushels.toLocaleString()}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground text-right">{r.moisturePercent}%</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.destination === 'bin' ? 'Bin' : 'Town'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground text-right">{r.landlordSplitPercent}%</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.fsaFarmNumber || '—'}</td>
                          <td className="py-2 px-2 font-mono text-xs text-foreground">{r.fsaTractNumber || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-harvest/30">
                      <td colSpan={3} className="py-2 px-2 font-mono text-xs font-bold text-foreground">TOTAL</td>
                      <td className="py-2 px-2 font-mono text-xs font-bold text-harvest text-right">{totalHarvestBu.toLocaleString()} bu</td>
                      <td colSpan={5}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {harvestRecords.length === 0 && (
                <p className="text-center text-muted-foreground font-mono text-sm py-8">No harvest records to report</p>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
