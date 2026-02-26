import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFarm } from '@/store/farmStore';
import { AlertTriangle, Database, ArrowRight, History } from 'lucide-react';

export default function SeasonRolloverModal() {
    const { activeSeason, rolloverToNewSeason } = useFarm();
    const [open, setOpen] = useState(false);
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        // Trigger if we are in a new year but haven't rolled over yet
        if (activeSeason < currentYear) {
            setOpen(true);
        }
    }, [activeSeason, currentYear]);

    const handleRollover = () => {
        rolloverToNewSeason(currentYear);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md bg-card border-amber-500/30">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-500">
                        <AlertTriangle size={24} />
                        Season Rollover — {currentYear}
                    </DialogTitle>
                    <DialogDescription className="font-mono text-xs pt-2">
                        A new calendar year has begun. Missouri regulatory standards recommend archiving previous records and resetting active dashboards to ensure data integrity.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-muted p-3 rounded-lg border border-border/50">
                        <div className="flex items-center justify-center gap-4 py-2">
                            <div className="text-center">
                                <div className="text-[10px] text-muted-foreground uppercase font-mono">Current</div>
                                <div className="text-xl font-bold font-mono opacity-50">{activeSeason}</div>
                            </div>
                            <ArrowRight className="text-muted-foreground" size={20} />
                            <div className="text-center">
                                <div className="text-[10px] text-amber-500 uppercase font-mono">New Season</div>
                                <div className="text-2xl font-bold font-mono text-amber-500">{currentYear}</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase font-mono flex items-center gap-1.5 text-foreground/80">
                            <History size={14} />
                            The Rollover Process
                        </h4>
                        <ul className="text-xs space-y-2 text-muted-foreground font-mono list-disc pl-4">
                            <li><span className="text-foreground">Snapshot Archive:</span> An automated backup will be downloaded now.</li>
                            <li><span className="text-foreground">Archive Storage:</span> {activeSeason} data is saved under "Historical Seasons".</li>
                            <li><span className="text-foreground">Data Carry-over:</span> Fields, Bin names, and Spray Recipes persist.</li>
                            <li><span className="text-foreground">Initialization:</span> Active dashboard is cleared for {currentYear}.</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-xs font-mono"
                    >
                        NOT NOW
                    </Button>
                    <Button
                        onClick={handleRollover}
                        className="bg-amber-500 text-amber-950 hover:bg-amber-600 font-bold"
                    >
                        START {currentYear} SEASON
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
