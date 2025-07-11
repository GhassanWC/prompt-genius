
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
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <Card className="mb-2 bg-secondary/50">
        <CardContent className="p-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className={cn("touch-none", isReadOnly ? "cursor-not-allowed" : "cursor-grab")} {...listeners} disabled={isReadOnly}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {stepNumber}
          </div>
          <div className="flex-grow text-left overflow-hidden">
            <p className="font-medium truncate">{prompt.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {prompt.userPrompt}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)} disabled={isReadOnly}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(prompt.id)} disabled={isReadOnly}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
