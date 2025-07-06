'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Prompt } from '@/lib/projects';
import { PlatformIcon } from './platform-icon';

interface SortablePromptItemProps {
  prompt: Prompt;
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
}

export function SortablePromptItem({ prompt, onEdit, onDelete }: SortablePromptItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <Card className="mb-2 bg-secondary/50">
        <CardContent className="p-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="cursor-grab touch-none" {...listeners}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
          <PlatformIcon platform={prompt.environment} className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-grow text-left overflow-hidden">
            <p className="font-medium truncate">{prompt.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {prompt.prompt}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(prompt)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(prompt.id)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
