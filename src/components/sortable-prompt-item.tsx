
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Prompt } from '@/lib/projects';
import { cn } from '@/lib/utils';

interface SortablePromptItemProps {
  prompt: Prompt;
  stepNumber: number;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  isReadOnly?: boolean;
}

export function SortablePromptItem({ prompt, stepNumber, onEdit, onDelete, isReadOnly = false }: SortablePromptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.id, disabled: isReadOnly });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <Card className={cn(
        "mb-2 bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 rounded-xl transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm",
        isDragging && "shadow-lg border-gray-300 dark:border-gray-700"
      )}>
        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "touch-none h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg",
              isReadOnly ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
            )} 
            {...listeners} 
            disabled={isReadOnly}
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#00171f] dark:bg-white text-sm font-bold text-white dark:text-[#00171f]">
            {stepNumber}
          </div>
          <div className="flex-grow text-left overflow-hidden min-w-0">
            <p className="font-semibold text-[#00171f] dark:text-white truncate text-sm sm:text-base">{prompt.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
              {prompt.userPrompt}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(prompt)} 
              disabled={isReadOnly}
              className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-[#00171f] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" 
              onClick={() => onDelete(prompt.id)} 
              disabled={isReadOnly}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
