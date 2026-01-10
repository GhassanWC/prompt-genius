'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  priority: 'essential' | 'important' | 'optional';
  estimatedSteps: number;
}

export interface CustomFeature {
  name: string;
  description: string;
}

interface FeatureSelectorProps {
  features: FeatureCategory[];
  selectedFeatureIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  customFeatures: CustomFeature[];
  onCustomFeaturesChange: (features: CustomFeature[]) => void;
  maxFeatures: number;
  disabled?: boolean;
}

export function FeatureSelector({
  features,
  selectedFeatureIds,
  onSelectionChange,
  customFeatures,
  onCustomFeaturesChange,
  maxFeatures,
  disabled = false,
}: FeatureSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [showAddFeature, setShowAddFeature] = React.useState(false);
  const [newFeatureName, setNewFeatureName] = React.useState('');
  const [newFeatureDescription, setNewFeatureDescription] = React.useState('');

  const selectedCount = selectedFeatureIds.length + customFeatures.length;
  const canAddMore = selectedCount < maxFeatures;
  const isAtLimit = selectedCount >= maxFeatures;

  const handleFeatureToggle = (featureId: string) => {
    if (disabled) return;
    
    if (selectedFeatureIds.includes(featureId)) {
      onSelectionChange(selectedFeatureIds.filter(id => id !== featureId));
    } else {
      if (canAddMore) {
        onSelectionChange([...selectedFeatureIds, featureId]);
      }
    }
  };

  const handleAddCustomFeature = () => {
    if (!newFeatureName.trim() || !newFeatureDescription.trim()) return;
    if (!canAddMore) return;

    const newFeature: CustomFeature = {
      name: newFeatureName.trim(),
      description: newFeatureDescription.trim(),
    };

    onCustomFeaturesChange([...customFeatures, newFeature]);
    setNewFeatureName('');
    setNewFeatureDescription('');
    setShowAddFeature(false);
  };

  const handleRemoveCustomFeature = (index: number) => {
    if (disabled) return;
    onCustomFeaturesChange(customFeatures.filter((_, i) => i !== index));
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'destructive';
      case 'important':
        return 'default';
      case 'optional':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const selectedFeatures = features.filter(f => selectedFeatureIds.includes(f.id));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          Select Features ({selectedCount}/{maxFeatures})
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto min-h-[42px] py-2"
              disabled={disabled || isAtLimit}
            >
              <div className="flex flex-wrap gap-1 flex-1 text-left">
                {selectedCount === 0 ? (
                  <span className="text-muted-foreground">Select features to include...</span>
                ) : (
                  <>
                    {selectedFeatures.map((feature) => (
                      <Badge key={feature.id} variant="secondary" className="mr-1">
                        {feature.name}
                      </Badge>
                    ))}
                    {customFeatures.map((feature, index) => (
                      <Badge key={`custom-${index}`} variant="outline" className="mr-1">
                        {feature.name}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <div className="max-h-[400px] overflow-y-auto">
              <div className="p-2 space-y-2">
                {features.map((feature) => {
                  const isSelected = selectedFeatureIds.includes(feature.id);
                  const isDisabled = !isSelected && isAtLimit;
                  
                  return (
                    <div
                      key={feature.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected && "bg-accent border-primary",
                        isDisabled && "opacity-50 cursor-not-allowed",
                        !isDisabled && "hover:bg-accent/50"
                      )}
                      onClick={() => !isDisabled && handleFeatureToggle(feature.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled || disabled}
                        onCheckedChange={() => handleFeatureToggle(feature.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{feature.name}</span>
                          <Badge variant={getPriorityBadgeVariant(feature.priority)} className="text-xs">
                            {feature.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            (~{feature.estimatedSteps} steps)
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {customFeatures.length > 0 && (
                <div className="border-t p-2 space-y-2">
                  <Label className="text-sm font-semibold">Custom Features</Label>
                  {customFeatures.map((feature, index) => (
                    <div key={`custom-${index}`} className="flex items-center justify-between p-2 rounded border bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{feature.name}</div>
                        <div className="text-xs text-muted-foreground">{feature.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCustomFeature(index)}
                        disabled={disabled}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isAtLimit && (
        <Alert>
          <AlertDescription>
            You've reached the maximum number of features ({maxFeatures}) for your plan. Remove some features or upgrade to add more.
          </AlertDescription>
        </Alert>
      )}

      {!showAddFeature && canAddMore && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddFeature(true)}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Feature
        </Button>
      )}

      {showAddFeature && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="custom-feature-name">Feature Name</Label>
            <Input
              id="custom-feature-name"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder="e.g., Payment Integration"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-feature-desc">Description</Label>
            <Textarea
              id="custom-feature-desc"
              value={newFeatureDescription}
              onChange={(e) => setNewFeatureDescription(e.target.value)}
              placeholder="Describe what this feature should include..."
              className="min-h-[80px]"
              disabled={disabled}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleAddCustomFeature}
              disabled={!newFeatureName.trim() || !newFeatureDescription.trim() || disabled}
              className="flex-1"
            >
              Add Feature
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddFeature(false);
                setNewFeatureName('');
                setNewFeatureDescription('');
              }}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

