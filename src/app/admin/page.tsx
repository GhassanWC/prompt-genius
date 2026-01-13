'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Loader2,
  Users,
  FolderOpen,
  AlertTriangle,
  Shield,
  Globe,
  Lock,
  CreditCard,
  MessageSquare,
  Star,
  Search,
  X,
  Filter,
  TrendingUp,
  Activity,
  BarChart3,
  Zap,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Layers,
  Save,
  CheckCircle2,
  XCircle,
  Plus,
  Copy,
  CheckSquare,
  Square,
} from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { auth } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  photoURL: string | null;
  createdAt: Date | null;
  projectCount: number;
  clonedProjectCount: number;
  isAdmin: boolean;
  masterAdmin: boolean;
}

interface AdminProject {
  id: string;
  name: string;
  idea: string;
  aiRole: string | null;
  summary: string | null;
  isPublic: boolean;
  imageUrl: string | null;
  createdAt: Date | null;
  roles: Record<string, string>;
  members: Record<string, boolean>;
  owner: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
}

interface AdminSubscription {
  userId: string;
  tierId: string;
  subscriptionId: string | null;
  status: string | null;
  userEmail: string | null;
  userName: string | null;
  productName: string | null;
  variantName: string | null;
  cancelled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  renewsAt: Date | null;
  endsAt: Date | null;
  cumulativeQuantity: number;
}

interface AdminFeedback {
  id: string;
  userId: string | null;
  rating: number;
  comments: string;
  createdAt: Date | null;
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
}

interface Tier {
  id: string;
  name: string;
  features: {
    projectLimit: number;
    ideasPerRequest: number;
    totalIdeaGenerations: number;
    fullPromptGeneration: boolean;
    publicProjects: boolean;
    communityAccess: boolean;
    aiPromptEnhancement: boolean;
    executionFollowUpAgent: boolean;
    promptPlayground: boolean;
    cloning: boolean;
    support: 'none' | 'community' | 'priority';
    [key: string]: any; // Allow custom features
  };
}

const formatDate = (value?: Date | null) =>
  value ? new Date(value).toLocaleDateString() : '—';

// Predefined feature keys that should be handled specially
const PREDEFINED_FEATURES = [
  'projectLimit',
  'ideasPerRequest',
  'totalIdeaGenerations',
  'fullPromptGeneration',
  'publicProjects',
  'communityAccess',
  'aiPromptEnhancement',
  'executionFollowUpAgent',
  'promptPlayground',
  'cloning',
  'support',
];

// Add Feature Dialog Component - Adds feature to all tiers
function AddFeatureDialog({
  open,
  onOpenChange,
  onAddComplete,
  existingFeatureKeys,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddComplete: () => void;
  existingFeatureKeys: string[];
}) {
  const [fieldName, setFieldName] = useState('');
  const [type, setType] = useState('string');
  const [stringValue, setStringValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [booleanValue, setBooleanValue] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!fieldName.trim()) {
      return;
    }

    if (existingFeatureKeys.includes(fieldName.trim())) {
      return;
    }

    let value: any;
    switch (type) {
      case 'string':
        value = stringValue;
        break;
      case 'number':
        value = parseFloat(numberValue) || 0;
        break;
      case 'boolean':
        value = booleanValue;
        break;
      default:
        value = stringValue;
    }

    setIsAdding(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fieldName: fieldName.trim(),
          type,
          defaultValue: value,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to add feature' }));
        throw new Error(errorData.error || 'Failed to add feature');
      }

      const result = await res.json();
      console.log('Feature added successfully:', result);

      setFieldName('');
      setStringValue('');
      setNumberValue('');
      setBooleanValue(false);
      onOpenChange(false);
      await onAddComplete();
    } catch (error: any) {
      console.error('Error adding feature:', error);
      // Error will be shown via toast in onAddComplete
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setFieldName('');
      setStringValue('');
      setNumberValue('');
      setBooleanValue(false);
      setType('string');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle>Add New Feature to All Tiers</DialogTitle>
          <DialogDescription>
            Add a new feature field to all tiers (Free, Plus, Pro). You can adjust the value for each tier after adding.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="field-name">Field Name</Label>
            <Input
              id="field-name"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="e.g., customFeature"
              className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="field-type" className="border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">string</SelectItem>
                <SelectItem value="number">number</SelectItem>
                <SelectItem value="boolean">boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-value">
              Default Value ({type === 'string' ? 'String' : type === 'number' ? 'Number' : 'Boolean'})
            </Label>
            {type === 'string' && (
              <Input
                id="field-value"
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
                placeholder="Enter default string value"
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white"
              />
            )}
            {type === 'number' && (
              <Input
                id="field-value"
                type="number"
                value={numberValue}
                onChange={(e) => setNumberValue(e.target.value)}
                placeholder="Enter default number value"
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white"
              />
            )}
            {type === 'boolean' && (
              <Select
                value={booleanValue.toString()}
                onValueChange={(val) => setBooleanValue(val === 'true')}
              >
                <SelectTrigger id="field-value" className="border-gray-200 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!fieldName.trim() || existingFeatureKeys.includes(fieldName.trim()) || isAdding}
            className="bg-[#00171f] hover:bg-[#00171f]/90 text-white dark:bg-white dark:text-[#00171f] dark:hover:bg-gray-100"
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to All Tiers'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tier Card Component
function TierCard({
  tier,
  onUpdate,
  saving,
}: {
  tier: Tier;
  onUpdate: (tierId: string, updates: Partial<Tier['features']> & { name?: string }) => Promise<void>;
  saving: string | null;
}) {
  const [localTier, setLocalTier] = useState<Tier>(tier);

  // Update local tier when prop changes
  useEffect(() => {
    setLocalTier(tier);
  }, [tier]);

  const [isEditing, setIsEditing] = useState(false);

  // Get custom features (not in predefined list)
  const customFeatures = Object.keys(localTier.features).filter(
    (key) => !PREDEFINED_FEATURES.includes(key)
  );

  // Debug: Log custom features
  useEffect(() => {
    if (customFeatures.length > 0) {
      console.log(`[TierCard ${tier.id}] Custom features found:`, customFeatures);
    }
  }, [customFeatures, tier.id]);

  return (
    <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-[#00171f] dark:text-white flex items-center gap-2">
              <Badge
                className={
                  tier.id === 'pro'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0'
                    : tier.id === 'plus'
                    ? 'bg-primary text-primary-foreground border-0'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }
              >
                {tier.name || tier.id.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm">Manage features for {tier.id} tier</CardDescription>
          </div>
          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => {
                setLocalTier(tier);
                setIsEditing(true);
              }}
              className="hover:bg-gray-50 dark:hover:bg-gray-800 h-10 px-5"
            >
              Edit
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setLocalTier(tier);
                }}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await onUpdate(tier.id, {
                    name: localTier.name,
                    ...localTier.features,
                  });
                  setIsEditing(false);
                }}
                disabled={saving === tier.id}
                className="bg-[#00171f] hover:bg-[#00171f]/90 text-white dark:bg-white dark:text-[#00171f] dark:hover:bg-gray-100 h-10 px-5"
              >
                {saving === tier.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier Name */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#00171f] dark:text-white block">Tier Name</label>
            {isEditing ? (
              <Input
                value={localTier.name}
                onChange={(e) => setLocalTier({ ...localTier, name: e.target.value })}
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
              />
            ) : (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">{tier.name}</p>
            )}
          </div>

          {/* Project Limit */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#00171f] dark:text-white block">Project Limit</label>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={localTier.features.projectLimit}
                onChange={(e) =>
                  setLocalTier({
                    ...localTier,
                    features: {
                      ...localTier.features,
                      projectLimit: parseInt(e.target.value) || 0,
                    },
                  })
                }
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
              />
            ) : (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">{tier.features.projectLimit}</p>
            )}
          </div>

          {/* Ideas Per Request */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#00171f] dark:text-white block">Ideas Per Request</label>
            {isEditing ? (
              <Input
                type="number"
                min="1"
                value={localTier.features.ideasPerRequest ?? 6}
                onChange={(e) =>
                  setLocalTier({
                    ...localTier,
                    features: {
                      ...localTier.features,
                      ideasPerRequest: parseInt(e.target.value) || 6,
                    },
                  })
                }
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
              />
            ) : (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">{tier.features.ideasPerRequest ?? 6}</p>
            )}
          </div>

          {/* Total Idea Generations */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#00171f] dark:text-white block">Total Idea Generations</label>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={localTier.features.totalIdeaGenerations ?? 1}
                onChange={(e) =>
                  setLocalTier({
                    ...localTier,
                    features: {
                      ...localTier.features,
                      totalIdeaGenerations: parseInt(e.target.value) || 1,
                    },
                  })
                }
                className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
              />
            ) : (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">{tier.features.totalIdeaGenerations ?? 1}</p>
            )}
          </div>

          {/* Boolean Features */}
          {[
            { key: 'fullPromptGeneration', label: 'Full Prompt Generation' },
            { key: 'publicProjects', label: 'Public Projects' },
            { key: 'communityAccess', label: 'Community Access' },
            { key: 'aiPromptEnhancement', label: 'AI Prompt Enhancement' },
            { key: 'executionFollowUpAgent', label: 'Execution Follow-Up Agent' },
            { key: 'promptPlayground', label: 'Prompt Playground' },
            { key: 'cloning', label: 'Cloning' },
          ].map(({ key, label }) => {
            const isEnabled = localTier.features[key as keyof typeof localTier.features] as boolean;
            const currentValue = tier.features[key as keyof typeof tier.features] as boolean;
            return (
              <div key={key} className="space-y-3">
                <label className="text-sm font-medium text-[#00171f] dark:text-white block">{label}</label>
                {isEditing ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setLocalTier({
                          ...localTier,
                          features: {
                            ...localTier.features,
                            [key]: !isEnabled,
                          },
                        })
                      }
                      className={`
                        relative inline-flex h-11 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00171f] focus:ring-offset-2 dark:focus:ring-white
                        ${isEnabled 
                          ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      <span
                        className={`
                          inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                          ${isEnabled ? 'translate-x-11' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {currentValue ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">Enabled</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Disabled</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Support Level */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#00171f] dark:text-white block">Support Level</label>
            {isEditing ? (
              <Select
                value={localTier.features.support}
                onValueChange={(value: 'none' | 'community' | 'priority') =>
                  setLocalTier({
                    ...localTier,
                    features: {
                      ...localTier.features,
                      support: value,
                    },
                  })
                }
              >
                <SelectTrigger className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center">
                <Badge
                  className={
                    tier.features.support === 'priority'
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 px-4 py-2.5 text-sm font-medium'
                      : tier.features.support === 'community'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2.5 text-sm font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium'
                  }
                >
                  {tier.features.support.charAt(0).toUpperCase() + tier.features.support.slice(1)}
                </Badge>
              </div>
            )}
          </div>

          {/* Custom Features - Display as editable fields like predefined features */}
          {customFeatures.map((key) => {
            const value = localTier.features[key];
            const valueType = typeof value;
            const displayLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
            const currentValue = tier.features[key];
            
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#00171f] dark:text-white block">{displayLabel}</label>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFeatures = { ...localTier.features };
                        delete newFeatures[key];
                        setLocalTier({ ...localTier, features: newFeatures });
                      }}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete feature"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  valueType === 'boolean' ? (
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() =>
                          setLocalTier({
                            ...localTier,
                            features: {
                              ...localTier.features,
                              [key]: !value,
                            },
                          })
                        }
                        className={`
                          relative inline-flex h-11 w-20 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00171f] focus:ring-offset-2 dark:focus:ring-white
                          ${value 
                            ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700' 
                            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        <span
                          className={`
                            inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
                            ${value ? 'translate-x-11' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  ) : valueType === 'number' ? (
                    <Input
                      type="number"
                      value={value as number}
                      onChange={(e) =>
                        setLocalTier({
                          ...localTier,
                          features: {
                            ...localTier.features,
                            [key]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
                    />
                  ) : (
                    <Input
                      value={String(value)}
                      onChange={(e) =>
                        setLocalTier({
                          ...localTier,
                          features: {
                            ...localTier.features,
                            [key]: e.target.value,
                          },
                        })
                      }
                      className="border-gray-200 dark:border-gray-700 focus:border-[#00171f] dark:focus:border-white transition-colors h-10"
                    />
                  )
                ) : (
                  // View mode - display with appropriate UI elements
                  valueType === 'boolean' ? (
                    <div className="flex items-center">
                      {currentValue ? (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Disabled</span>
                        </div>
                      )}
                    </div>
                  ) : valueType === 'number' ? (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">
                      {String(value)}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 py-2.5 px-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 min-h-[40px] flex items-center">
                      {String(value)}
                    </p>
                  )
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [addFeatureDialogOpen, setAddFeatureDialogOpen] = useState(false);
  const [savingTier, setSavingTier] = useState<string | null>(null);

  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [projectSearch, setProjectSearch] = useState('');
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');

  const [projectVisibilityFilter, setProjectVisibilityFilter] = useState<string>('all');
  const [subscriptionTierFilter, setSubscriptionTierFilter] = useState<string>('all');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<string>('all');
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<string>('all');

  // Dialog states
  const [adminToggleDialogOpen, setAdminToggleDialogOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<AdminUser | null>(null);
  const [togglingAdmin, setTogglingAdmin] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<AdminProject | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCheckingAdmin(false);
      router.push('/login');
      return;
    }

    // Check admin access via API to ensure server-side validation
    const checkAdminAccess = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/admin?type=users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: 'no-store',
        });

        if (res.status === 403) {
          setError('Unauthorized: Admin access required');
          setCheckingAdmin(false);
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to verify admin access');
        }

        setCheckingAdmin(false);
      } catch (err: any) {
        console.error('Admin check error:', err);
        setError(err.message || 'Failed to verify admin access');
        setCheckingAdmin(false);
      }
    };

    checkAdminAccess();
  }, [user, authLoading, router, isAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAdmin || !user) return;

      setLoading(true);
      setError(null);

      try {
        const token = await auth.currentUser?.getIdToken();

        const [usersRes, projectsRes, subscriptionsRes, feedbacksRes, tiersRes] = await Promise.all([
          fetch('/api/admin?type=users', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
          }),
          fetch('/api/admin?type=projects', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
          }),
          fetch('/api/admin?type=subscriptions', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
          }),
          fetch('/api/admin?type=feedbacks', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
          }),
          fetch('/api/admin/tiers', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: 'no-store',
          }),
        ]);

        // Check for 403 errors first
        if (usersRes.status === 403 || projectsRes.status === 403 || subscriptionsRes.status === 403 || feedbacksRes.status === 403 || tiersRes.status === 403) {
          setError('Unauthorized: Admin access required');
          return;
        }

        // Parse responses individually to handle partial failures
        let usersData: any = { users: [] };
        let projectsData: any = { projects: [] };
        let subscriptionsData: any = { subscriptions: [] };
        let feedbacksData: any = { feedbacks: [] };
        let tiersData: any = { tiers: [] };

        try {
          if (usersRes.ok) {
            usersData = await usersRes.json();
          } else {
            console.error('[Admin Dashboard] Failed to fetch users:', usersRes.status, usersRes.statusText);
          }
        } catch (e) {
          console.error('[Admin Dashboard] Error parsing users response:', e);
        }

        try {
          if (projectsRes.ok) {
            projectsData = await projectsRes.json();
          } else {
            console.error('[Admin Dashboard] Failed to fetch projects:', projectsRes.status, projectsRes.statusText);
          }
        } catch (e) {
          console.error('[Admin Dashboard] Error parsing projects response:', e);
        }

        try {
          if (subscriptionsRes.ok) {
            subscriptionsData = await subscriptionsRes.json();
          } else {
            console.error('[Admin Dashboard] Failed to fetch subscriptions:', subscriptionsRes.status, subscriptionsRes.statusText);
          }
        } catch (e) {
          console.error('[Admin Dashboard] Error parsing subscriptions response:', e);
        }

        try {
          if (feedbacksRes.ok) {
            feedbacksData = await feedbacksRes.json();
          } else {
            console.error('[Admin Dashboard] Failed to fetch feedbacks:', feedbacksRes.status, feedbacksRes.statusText);
          }
        } catch (e) {
          console.error('[Admin Dashboard] Error parsing feedbacks response:', e);
        }

        try {
          if (tiersRes.ok) {
            tiersData = await tiersRes.json();
            console.log('[Admin Dashboard] Tiers response:', tiersData);
            console.log('[Admin Dashboard] Tiers count:', tiersData.tiers?.length || 0);
          } else {
            const errorText = await tiersRes.text();
            console.error('[Admin Dashboard] Failed to fetch tiers:', tiersRes.status, tiersRes.statusText, errorText);
          }
        } catch (e) {
          console.error('[Admin Dashboard] Error parsing tiers response:', e);
        }

        console.log('[Admin Dashboard] Subscriptions response:', subscriptionsData);
        console.log('[Admin Dashboard] Subscriptions count:', subscriptionsData.subscriptions?.length || 0);

        setUsers(usersData.users || []);
        setProjects(projectsData.projects || []);
        setSubscriptions(subscriptionsData.subscriptions || []);
        setFeedbacks(feedbacksData.feedbacks || []);
        setTiers(tiersData.tiers || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, user]);

  // Handler to toggle admin status
  const handleToggleAdmin = async (targetUser: AdminUser) => {
    if (!targetUser) return;

    // Prevent toggling master admin
    if (targetUser.masterAdmin) {
      toast({
        variant: 'destructive',
        title: 'Cannot Modify Master Admin',
        description: 'Master admin status cannot be changed through the dashboard. It can only be modified directly in Firestore database.',
      });
      setAdminToggleDialogOpen(false);
      setUserToToggle(null);
      return;
    }

    setTogglingAdmin(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'setAdmin',
          userId: targetUser.uid,
          isAdmin: !targetUser.isAdmin,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update admin status');
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isAdmin: !u.isAdmin } : u))
      );

      toast({
        title: 'Admin Status Updated',
        description: `${targetUser.displayName || targetUser.email} is now ${
          !targetUser.isAdmin ? 'an admin' : 'a regular user'
        }.`,
      });

      setAdminToggleDialogOpen(false);
      setUserToToggle(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.message || 'Failed to update admin status',
      });
    } finally {
      setTogglingAdmin(false);
    }
  };

  // Handler to update tier
  const handleUpdateTier = async (tierId: string, updates: Partial<Tier['features']> & { name?: string }) => {
    setSavingTier(tierId);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // Extract name from updates, rest are features
      const { name, ...features } = updates;
      
      const res = await fetch('/api/admin/tiers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tierId,
          ...(name !== undefined && { name }),
          features,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update tier');
      }

      // Refresh tiers
      const tiersRes = await fetch('/api/admin/tiers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      });

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setTiers(tiersData.tiers || []);
      }

      toast({
        title: 'Tier Updated',
        description: `${tierId.toUpperCase()} tier features have been updated successfully.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.message || 'Failed to update tier',
      });
    } finally {
      setSavingTier(null);
    }
  };

  // Handler to delete project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setDeletingProject(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'deleteProject',
          projectId: projectToDelete.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete project');
      }

      // Update local state
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));

      toast({
        title: 'Project Deleted',
        description: `"${projectToDelete.name}" has been permanently deleted.`,
      });

      setDeleteProjectDialogOpen(false);
      setProjectToDelete(null);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: err.message || 'Failed to delete project',
      });
    } finally {
      setDeletingProject(false);
    }
  };

  // Handler to toggle user selection
  const handleToggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Handler to select/deselect all filtered users
  const handleToggleAllUsers = (filteredUsersList: AdminUser[]) => {
    const filteredIds = filteredUsersList.map((u) => u.uid);
    const allSelected = filteredIds.every((id) => selectedUserIds.has(id));
    
    if (allSelected) {
      // Deselect all filtered users
      setSelectedUserIds((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all filtered users
      setSelectedUserIds((prev) => {
        const newSet = new Set(prev);
        filteredIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Handler to copy selected user emails to clipboard
  const handleCopySelectedEmails = async () => {
    const selectedEmails = users
      .filter((u) => selectedUserIds.has(u.uid) && u.email)
      .map((u) => u.email)
      .filter(Boolean)
      .join(', ');

    if (!selectedEmails) {
      toast({
        variant: 'destructive',
        title: 'No Emails to Copy',
        description: 'Selected users have no email addresses.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedEmails);
      toast({
        title: 'Emails Copied',
        description: `${selectedUserIds.size} email${selectedUserIds.size > 1 ? 's' : ''} copied to clipboard.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Failed to copy emails to clipboard.',
      });
    }
  };

  // Clear selection when user search changes
  useEffect(() => {
    setSelectedUserIds(new Set());
  }, [userSearch]);

  // Filtered data using useMemo for performance - MUST be before any early returns
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const searchLower = userSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(searchLower) ||
        u.displayName?.toLowerCase().includes(searchLower) ||
        u.uid.toLowerCase().includes(searchLower) ||
        u.firstName?.toLowerCase().includes(searchLower) ||
        u.lastName?.toLowerCase().includes(searchLower)
    );
  }, [users, userSearch]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Search filter
    if (projectSearch.trim()) {
      const searchLower = projectSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.idea?.toLowerCase().includes(searchLower) ||
          p.owner?.email?.toLowerCase().includes(searchLower) ||
          p.owner?.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Visibility filter
    if (projectVisibilityFilter !== 'all') {
      filtered = filtered.filter((p) =>
        projectVisibilityFilter === 'public' ? p.isPublic : !p.isPublic
      );
    }

    return filtered;
  }, [projects, projectSearch, projectVisibilityFilter]);

  const filteredSubscriptions = useMemo(() => {
    let filtered = subscriptions;

    // Search filter
    if (subscriptionSearch.trim()) {
      const searchLower = subscriptionSearch.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.userEmail?.toLowerCase().includes(searchLower) ||
          s.userName?.toLowerCase().includes(searchLower) ||
          s.userId.toLowerCase().includes(searchLower) ||
          s.subscriptionId?.toLowerCase().includes(searchLower) ||
          s.productName?.toLowerCase().includes(searchLower) ||
          s.variantName?.toLowerCase().includes(searchLower)
      );
    }

    // Tier filter
    if (subscriptionTierFilter !== 'all') {
      filtered = filtered.filter((s) => s.tierId === subscriptionTierFilter);
    }

    // Status filter
    if (subscriptionStatusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === subscriptionStatusFilter);
    }

    return filtered;
  }, [subscriptions, subscriptionSearch, subscriptionTierFilter, subscriptionStatusFilter]);

  const filteredFeedbacks = useMemo(() => {
    let filtered = feedbacks;

    // Search filter
    if (feedbackSearch.trim()) {
      const searchLower = feedbackSearch.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.user?.email?.toLowerCase().includes(searchLower) ||
          f.user?.displayName?.toLowerCase().includes(searchLower) ||
          f.comments.toLowerCase().includes(searchLower)
      );
    }

    // Rating filter
    if (feedbackRatingFilter !== 'all') {
      const rating = parseInt(feedbackRatingFilter);
      filtered = filtered.filter((f) => f.rating === rating);
    }

    return filtered;
  }, [feedbacks, feedbackSearch, feedbackRatingFilter]);

  // Calculate analytics metrics using useMemo
  const analytics = useMemo(() => {
    const publicProjectsCount = projects.filter((p) => p.isPublic).length;
    const privateProjectsCount = projects.filter((p) => !p.isPublic).length;

    // Subscription metrics
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active').length;
    const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled').length;
    const plusSubscriptions = subscriptions.filter((s) => s.tierId === 'plus').length;
    const proSubscriptions = subscriptions.filter((s) => s.tierId === 'pro').length;
    const freeUsers = users.length - subscriptions.length;

    // Feedback metrics
    const averageRating =
      feedbacks.length > 0
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : '0.0';
    const fiveStarFeedbacks = feedbacks.filter((f) => f.rating === 5).length;
    const feedbackPercentage =
      users.length > 0 ? ((feedbacks.length / users.length) * 100).toFixed(1) : '0.0';

    // Activity metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = users.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= thirtyDaysAgo
    ).length;
    const recentProjects = projects.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo
    ).length;
    const last7DaysUsers = users.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= sevenDaysAgo
    ).length;
    const last7DaysProjects = projects.filter(
      (p) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo
    ).length;

    // Active users (users with at least one project)
    const activeUsers = users.filter((u) => u.projectCount > 0).length;

    // Total project clones
    const totalClones = users.reduce((sum, u) => sum + u.clonedProjectCount, 0);

    return {
      publicProjectsCount,
      privateProjectsCount,
      activeSubscriptions,
      cancelledSubscriptions,
      plusSubscriptions,
      proSubscriptions,
      freeUsers,
      averageRating,
      fiveStarFeedbacks,
      feedbackPercentage,
      recentUsers,
      recentProjects,
      last7DaysUsers,
      last7DaysProjects,
      activeUsers,
      totalClones,
    };
  }, [users, projects, subscriptions, feedbacks]);

  // Early returns AFTER all hooks
  if (checkingAdmin || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#00171f]">
        <Loader2 className="h-16 w-16 animate-spin text-[#00171f] dark:text-white" />
      </div>
    );
  }

  if (!isAdmin || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#00171f]">
        <Card className="max-w-md w-full border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription className="text-red-700">
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full bg-[#00171f] hover:bg-[#00171f]/90 text-white">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#00171f] text-[#00171f] dark:text-white relative overflow-x-hidden">
      {/* Subtle geometric background pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300171f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#00171f]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-0 font-bold group">
            <Image
              src="/logo.png"
              alt="Prompt Genius Logo"
              width={60}
              height={60}
              className="ml-1 mr-1"
            />
            <h1 className="font-headline text-xl text-[#00171f] dark:text-white tracking-tight hidden sm:block">
              Prompt Genius AI
            </h1>
          </Link>
          <div className="flex items-center gap-6">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
            <UserNav />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-32 space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-headline text-[#00171f] dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage users and projects</p>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Analytics Cards */}
        <div className="space-y-6">
          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Users className="h-5 w-5 text-[#00171f] dark:text-white" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#00171f] dark:text-white">{users.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.activeUsers} active users
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <FolderOpen className="h-5 w-5 text-[#00171f] dark:text-white" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#00171f] dark:text-white">{projects.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.totalClones} clones
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.activeSubscriptions}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subscriptions.length} total subscriptions
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Total Feedbacks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{feedbacks.length}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.feedbackPercentage}% response rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Public Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.publicProjectsCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.privateProjectsCount} private
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Star className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                  Average Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{analytics.averageRating}</p>
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.fiveStarFeedbacks} five-star reviews
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Growth (30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  +{analytics.recentUsers} users
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  +{analytics.recentProjects} projects
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Recent Activity (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  +{analytics.last7DaysUsers} users
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  +{analytics.last7DaysProjects} projects
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Subscription Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Free</span>
                    <span className="text-lg font-bold text-[#00171f] dark:text-white">{analytics.freeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Plus</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{analytics.plusSubscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Pro</span>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{analytics.proSubscriptions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Active</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{analytics.activeSubscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Cancelled</span>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{analytics.cancelledSubscriptions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Other</span>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {subscriptions.length - analytics.activeSubscriptions - analytics.cancelledSubscriptions}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-[#00171f] border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-[#00171f] dark:text-white">
                  <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Active Users</span>
                    <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{analytics.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Inactive Users</span>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                      {users.length - analytics.activeUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Engagement Rate</span>
                    <span className="text-lg font-bold text-[#00171f] dark:text-white">
                      {users.length > 0
                        ? ((analytics.activeUsers / users.length) * 100).toFixed(1)
                        : '0.0'}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 rounded-2xl">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Error</AlertTitle>
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="users" className="space-y-5">
          <TabsList className="bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none p-0 h-auto w-full justify-start gap-0">
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="projects"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Subscriptions ({subscriptions.length})
            </TabsTrigger>
            <TabsTrigger
              value="feedbacks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedbacks ({feedbacks.length})
            </TabsTrigger>
            <TabsTrigger
              value="tiers"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#00171f] dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 data-[state=active]:text-[#00171f] dark:data-[state=active]:text-white hover:text-[#00171f] dark:hover:text-white transition-colors"
            >
              <Layers className="h-4 w-4 mr-2" />
              Tiers ({tiers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {/* Search and Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search users by name, email, or UID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 dark:border-gray-700"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {selectedUserIds.size > 0 && (
                <Button
                  onClick={handleCopySelectedEmails}
                  className="bg-[#00171f] hover:bg-[#00171f]/90 text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy {selectedUserIds.size} Email{selectedUserIds.size > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">
                  {userSearch ? 'No users match your search' : 'No users found'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing <span className="font-semibold">{filteredUsers.length}</span> of{' '}
                    <span className="font-semibold">{users.length}</span> users
                    {selectedUserIds.size > 0 && (
                      <span className="ml-2 text-[#00171f] dark:text-white font-semibold">
                        ({selectedUserIds.size} selected)
                      </span>
                    )}
                  </p>
                  {selectedUserIds.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUserIds(new Set())}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => handleToggleAllUsers(filteredUsers)}
                            className="flex items-center justify-center hover:opacity-70 transition-opacity"
                            title={filteredUsers.every((u) => selectedUserIds.has(u.uid)) ? 'Deselect all' : 'Select all'}
                          >
                            {filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.has(u.uid)) ? (
                              <CheckSquare className="h-5 w-5 text-[#00171f] dark:text-white" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Projects
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Cloned
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Admin
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                      {filteredUsers.map((adminUser) => (
                        <tr
                          key={adminUser.uid}
                          className={`border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900 ${
                            selectedUserIds.has(adminUser.uid) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleToggleUserSelection(adminUser.uid)}
                              className="flex items-center justify-center hover:opacity-70 transition-opacity"
                            >
                              {selectedUserIds.has(adminUser.uid) ? (
                                <CheckSquare className="h-5 w-5 text-[#00171f] dark:text-white" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {adminUser.photoURL ? (
                                <Image
                                  src={adminUser.photoURL}
                                  alt={adminUser.displayName || 'User'}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-[#00171f] dark:text-white">
                                  {adminUser.displayName || 'No name'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{adminUser.uid}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {adminUser.email || '—'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {adminUser.createdAt
                              ? formatDistanceToNow(adminUser.createdAt, { addSuffix: true })
                              : '—'}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#00171f] dark:text-white">
                            {adminUser.projectCount}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#00171f] dark:text-white">
                            {adminUser.clonedProjectCount}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {adminUser.masterAdmin ? (
                                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-sm px-2.5 py-1 whitespace-nowrap">
                                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                                  <span className="text-xs font-semibold">Master Admin</span>
                                </Badge>
                              ) : adminUser.isAdmin ? (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-2.5 py-1 whitespace-nowrap">
                                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                                  <span className="text-xs font-semibold">Admin</span>
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {!adminUser.masterAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setUserToToggle(adminUser);
                                  setAdminToggleDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                                title={adminUser.isAdmin ? 'Remove admin access' : 'Grant admin access'}
                              >
                                {adminUser.isAdmin ? (
                                  <ToggleRight className="h-4 w-4 text-amber-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {/* Search and Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search projects by name, description, or owner..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 dark:border-gray-700"
                />
                {projectSearch && (
                  <button
                    onClick={() => setProjectSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={projectVisibilityFilter} onValueChange={setProjectVisibilityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] border-gray-200">
                  <Filter className="h-4 w-4 mr-2 inline" />
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">
                  {projectSearch || projectVisibilityFilter !== 'all'
                    ? 'No projects match your filters'
                    : 'No projects found'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing <span className="font-semibold">{filteredProjects.length}</span> of{' '}
                    <span className="font-semibold">{projects.length}</span> projects
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="w-24 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Title
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Created
                        </th>
                        <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Visibility
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Members
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                      {filteredProjects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="px-4 py-4">
                            {project.imageUrl ? (
                              <Image
                                src={project.imageUrl}
                                alt={project.name}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Logo className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/projects/${project.id}`}
                              className="text-sm font-semibold text-[#00171f] dark:text-white hover:text-[#00171f]/70 dark:hover:text-white/70"
                            >
                              {project.name}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 overflow-hidden break-words text-ellipsis whitespace-normal max-w-xs">
                            {project.idea || 'No description'}
                          </td>
                          <td className="px-4 py-4">
                            {project.owner ? (
                              <div className="flex items-center gap-2">
                                {project.owner.photoURL && (
                                  <Image
                                    src={project.owner.photoURL}
                                    alt={project.owner.displayName || 'Owner'}
                                    width={24}
                                    height={24}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <p className="text-xs font-medium text-[#00171f] dark:text-white">
                                    {project.owner.displayName || 'No name'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{project.owner.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500">Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {project.createdAt
                              ? formatDistanceToNow(project.createdAt, { addSuffix: true })
                              : '—'}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {project.isPublic ? (
                              <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#00171f] dark:text-white">
                            {Object.keys(project.members || {}).length}
                          </td>
                          <td className="px-4 py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setProjectToDelete(project);
                                setDeleteProjectDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            {/* Search and Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search subscriptions by user, email, or subscription ID..."
                  value={subscriptionSearch}
                  onChange={(e) => setSubscriptionSearch(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 dark:border-gray-700"
                />
                {subscriptionSearch && (
                  <button
                    onClick={() => setSubscriptionSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={subscriptionTierFilter} onValueChange={setSubscriptionTierFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="on_trial">On Trial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">
                  {subscriptionSearch || subscriptionTierFilter !== 'all' || subscriptionStatusFilter !== 'all'
                    ? 'No subscriptions match your filters'
                    : 'No subscriptions found'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing <span className="font-semibold">{filteredSubscriptions.length}</span> of{' '}
                    <span className="font-semibold">{subscriptions.length}</span> subscriptions
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Tier
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Renews At
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                      {filteredSubscriptions.map((subscription) => (
                        <tr
                          key={subscription.userId}
                          className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-semibold text-[#00171f] dark:text-white">
                                {subscription.userName || subscription.userEmail || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{subscription.userEmail || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              className={
                                subscription.tierId === 'pro'
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0'
                                  : subscription.tierId === 'plus'
                                  ? 'bg-primary text-primary-foreground border-0'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }
                            >
                              {subscription.tierId?.toUpperCase() || 'FREE'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              className={
                                subscription.status === 'active'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
                                  : subscription.status === 'cancelled'
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                              }
                            >
                              {subscription.status || '—'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {subscription.productName || subscription.variantName || '—'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {subscription.createdAt
                              ? formatDistanceToNow(subscription.createdAt, { addSuffix: true })
                              : '—'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {subscription.renewsAt
                              ? formatDistanceToNow(subscription.renewsAt, { addSuffix: true })
                              : subscription.endsAt
                              ? `Ends ${formatDistanceToNow(subscription.endsAt, { addSuffix: true })}`
                              : '—'}
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-[#00171f] dark:text-white">
                            {subscription.cumulativeQuantity || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedbacks" className="mt-4">
            {/* Search and Filter Bar */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search feedbacks by user, email, or comments..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="pl-10 pr-10 border-gray-200 dark:border-gray-700"
                />
                {feedbackSearch && (
                  <button
                    onClick={() => setFeedbackSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={feedbackRatingFilter} onValueChange={setFeedbackRatingFilter}>
                <SelectTrigger className="w-full sm:w-[140px] border-gray-200">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">
                  {feedbackSearch || feedbackRatingFilter !== 'all'
                    ? 'No feedbacks match your filters'
                    : 'No feedbacks found'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#00171f] shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Showing <span className="font-semibold">{filteredFeedbacks.length}</span> of{' '}
                    <span className="font-semibold">{feedbacks.length}</span> feedbacks
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto text-sm text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Rating
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Comments
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#00171f]">
                      {filteredFeedbacks.map((feedback) => (
                        <tr
                          key={feedback.id}
                          className="border-b border-gray-100 dark:border-gray-800 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          <td className="px-4 py-4">
                            {feedback.user ? (
                              <div className="flex items-center gap-3">
                                {feedback.user.photoURL ? (
                                  <Image
                                    src={feedback.user.photoURL}
                                    alt={feedback.user.displayName || 'User'}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-[#00171f] dark:text-white">
                                    {feedback.user.displayName || 'Anonymous'}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{feedback.user.email || '—'}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">Anonymous</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < feedback.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-semibold text-[#00171f] dark:text-white">
                                {feedback.rating}/5
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 overflow-hidden break-words text-ellipsis whitespace-normal max-w-md">
                            {feedback.comments || 'No comments'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {feedback.createdAt
                              ? formatDistanceToNow(feedback.createdAt, { addSuffix: true })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tiers" className="mt-4">
            <div className="mb-4 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const token = await auth.currentUser?.getIdToken();
                    const tiersRes = await fetch('/api/admin/tiers', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      cache: 'no-store',
                    });

                    if (tiersRes.ok) {
                      const tiersData = await tiersRes.json();
                      setTiers(tiersData.tiers || []);
                      toast({
                        title: 'Tiers Refreshed',
                        description: 'Tier data has been refreshed successfully.',
                      });
                    } else {
                      throw new Error('Failed to refresh tiers');
                    }
                  } catch (err: any) {
                    console.error('Error refreshing tiers:', err);
                    toast({
                      variant: 'destructive',
                      title: 'Refresh Failed',
                      description: err.message || 'Failed to refresh tier data.',
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Tiers
              </Button>
              <Button
                onClick={() => setAddFeatureDialogOpen(true)}
                className="bg-[#00171f] hover:bg-[#00171f]/90 text-white dark:bg-white dark:text-[#00171f] dark:hover:bg-gray-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature to All Tiers
              </Button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : tiers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-8 text-center">
                <Layers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="mt-4 text-lg font-semibold text-[#00171f] dark:text-white">No tiers found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {tiers.map((tier) => (
                  <TierCard key={tier.id} tier={tier} onUpdate={handleUpdateTier} saving={savingTier} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Feature Dialog */}
      <AddFeatureDialog
        open={addFeatureDialogOpen}
        onOpenChange={setAddFeatureDialogOpen}
        onAddComplete={async () => {
          // Refresh tiers data
          try {
            const token = await auth.currentUser?.getIdToken();
            const tiersRes = await fetch('/api/admin/tiers', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              cache: 'no-store',
            });

            if (tiersRes.ok) {
              const tiersData = await tiersRes.json();
              setTiers(tiersData.tiers || []);
              toast({
                title: 'Feature Added',
                description: 'The feature has been added to all tiers successfully.',
              });
            } else {
              toast({
                variant: 'destructive',
                title: 'Refresh Failed',
                description: 'Failed to refresh tier data. Please refresh the page.',
              });
            }
          } catch (err) {
            console.error('Error refreshing tiers:', err);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'An error occurred while refreshing tier data.',
            });
          }
        }}
        existingFeatureKeys={(() => {
          const allKeys = new Set<string>();
          tiers.forEach(tier => {
            Object.keys(tier.features).forEach(key => allKeys.add(key));
          });
          return Array.from(allKeys);
        })()}
      />

      {/* Admin Toggle Dialog */}
      <AlertDialog open={adminToggleDialogOpen} onOpenChange={setAdminToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isAdmin ? 'Remove Admin Access' : 'Grant Admin Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.masterAdmin
                ? `Cannot modify master admin status. Master admin status can only be changed directly in Firestore database.`
                : userToToggle?.isAdmin
                ? `Are you sure you want to remove admin access from ${userToToggle.displayName || userToToggle.email}? They will no longer be able to access the admin dashboard.`
                : `Are you sure you want to grant admin access to ${userToToggle?.displayName || userToToggle?.email}? They will be able to access the admin dashboard and manage users and projects.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingAdmin || userToToggle?.masterAdmin}>
              {userToToggle?.masterAdmin ? 'Close' : 'Cancel'}
            </AlertDialogCancel>
            {!userToToggle?.masterAdmin && (
              <AlertDialogAction
                onClick={() => userToToggle && handleToggleAdmin(userToToggle)}
                disabled={togglingAdmin}
                className={userToToggle?.isAdmin ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {togglingAdmin ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : userToToggle?.isAdmin ? (
                  'Remove Admin'
                ) : (
                  'Grant Admin'
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
              All prompts and data associated with this project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deletingProject}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingProject ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

