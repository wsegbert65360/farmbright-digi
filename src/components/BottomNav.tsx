import { useLocation, useNavigate } from 'react-router-dom';
import { Map, Wheat, ClipboardList, FileText, Settings } from 'lucide-react';

const tabs = [
  { path: '/', icon: Map, label: 'Fields' },
  { path: '/logistics', icon: Wheat, label: 'Logistics' },
  { path: '/activity', icon: ClipboardList, label: 'Activity' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Setup' },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border print:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`touch-target flex flex-col items-center justify-center gap-1 py-3 px-3 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-mono font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
