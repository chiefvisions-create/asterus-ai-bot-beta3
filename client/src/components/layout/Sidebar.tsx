import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Settings, 
  Terminal,
  Cpu,
  Menu,
  X,
  FlaskConical,
  MessageSquare,
  Newspaper,
  Book,
  Layers
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trading", label: "Trading", icon: TrendingUp },
  { href: "/advanced-orders", label: "Advanced", icon: Layers },
  { href: "/backtester", label: "Backtester", icon: FlaskConical },
  { href: "/logs", label: "Logs", icon: Terminal },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/forum", label: "Community", icon: MessageSquare },
  { href: "/manual", label: "Manual", icon: Book },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-2">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        return (
          <div key={item.href}>
            <Link href={item.href}>
              <div 
                onClick={onClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-none transition-all group relative cursor-pointer ${
                  isActive ? 'text-primary bg-primary/5 border-l-2 border-primary' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-white/20 group-hover:text-white'}`} />
                <span className="text-[10px] uppercase font-display tracking-[0.2em]">{item.label}</span>
              </div>
            </Link>
          </div>
        );
      })}
    </nav>
  );

  const Logo = () => (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <Cpu className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-display font-black tracking-tighter text-gradient leading-none">
          ASTRAEUS
        </h1>
      </div>
      <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">Neural Node v2.5</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#060608] text-white">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#08080a] border-b border-white/5 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="font-display font-black tracking-tighter text-sm uppercase">Astraeus</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white/60">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#08080a] border-r border-white/5 p-0 w-64">
            <div className="flex flex-col h-full">
              <Logo />
              <div className="px-4 py-4">
                <NavLinks onClick={() => setOpen(false)} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#08080a] flex-col fixed inset-y-0 z-50">
        <Logo />
        <div className="px-4 py-4">
          <NavLinks />
        </div>
        <div className="p-8 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Core Synchronized</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-6 pt-24 lg:p-12 min-h-screen overflow-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
