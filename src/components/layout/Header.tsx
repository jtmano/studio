import { Dumbbell } from 'lucide-react';

export function Header() {
  return (
    <header className="py-6 px-4 md:px-8 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex items-center gap-3">
        <Dumbbell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Fitness Focus
        </h1>
      </div>
    </header>
  );
}
