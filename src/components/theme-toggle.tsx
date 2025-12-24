'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-[#00171f]/50 backdrop-blur-sm hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:scale-105 active:scale-95 group shadow-sm hover:shadow-md"
            aria-label="Toggle theme"
          >
            <div className="relative h-4 w-4 flex items-center justify-center">
              <Sun className="h-4 w-4 absolute rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-transparent group-hover:text-amber-600" />
              <Moon className="h-4 w-4 absolute rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-blue-400 dark:text-blue-300 group-hover:text-blue-500" />
            </div>
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {theme === 'light' ? 'dark' : 'light'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

