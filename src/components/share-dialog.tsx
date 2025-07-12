
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, X, AlertCircle, Lock, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Project, Role, Collaborator } from '@/lib/projects';
import { findUserByEmail, getUsers, updateProjectSettings } from '@/lib/project-client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  currentUser: User;
  onRolesChange: () => void; // Callback to refresh project data
}

export function ShareDialog({ open, onOpenChange, project, currentUser, onRolesChange }: ShareDialogProps) {
  const { toast } = useToast();
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [isPublic, setIsPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchCollaborators = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const userIds = Object.keys(project.roles);
          const userProfiles = await getUsers(userIds);
          const collaboratorData = userProfiles.map(profile => ({
            ...profile,
            role: project.roles[profile.uid],
          }));
          setCollaborators(collaboratorData);
          setRoles(project.roles);
          setIsPublic(project.isPublic);
        } catch (err: any) {
          setError(err.message || "Failed to load collaborators.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCollaborators();
    } else {
      // Reset state on close
      setCollaborators([]);
      setRoles({});
      setInviteEmail('');
      setIsLoading(true);
      setIsSaving(false);
      setIsInviting(false);
      setError(null);
    }
  }, [open, project.roles, project.isPublic]);

  const handleRoleChange = (uid: string, role: Role) => {
    setRoles(prev => ({ ...prev, [uid]: role }));
  };

  const handleRemoveCollaborator = (uid: string) => {
    // Optimistically update UI
    setCollaborators(prev => prev.filter(c => c.uid !== uid));
    const updatedRoles = { ...roles };
    delete updatedRoles[uid];
    setRoles(updatedRoles);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setError(null);
    try {
      const userToInvite = await findUserByEmail(inviteEmail);
      if (!userToInvite) {
        throw new Error("User with that email address not found.");
      }
      if (roles[userToInvite.uid]) {
        throw new Error("This user is already a collaborator on the project.");
      }

      // Optimistically update UI
      setCollaborators(prev => [...prev, { ...userToInvite, role: 'viewer' }]);
      setRoles(prev => ({ ...prev, [userToInvite.uid]: 'viewer' }));
      setInviteEmail('');

    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Invite Failed', description: err.message });
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateProjectSettings(currentUser.uid, project.id, { roles, isPublic });
      toast({ title: 'Success', description: 'Project settings have been updated.' });
      onRolesChange(); // Trigger data refresh on the parent page
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share & Access Settings</DialogTitle>
          <DialogDescription>
             Manage project visibility and who can collaborate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">

          <div className="space-y-3">
             <Label className="font-semibold">Project Visibility</Label>
              <RadioGroup value={isPublic ? 'public' : 'private'} onValueChange={(v) => setIsPublic(v === 'public')}>
                <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:border-primary">
                    <RadioGroupItem value="private" id="private"/>
                    <Label htmlFor="private" className="w-full font-normal">
                        <div className="flex items-center gap-3">
                            <Lock className="h-4 w-4" />
                            <div>
                                <p>Private</p>
                                <p className="text-xs text-muted-foreground">Only collaborators can access.</p>
                            </div>
                        </div>
                    </Label>
                </div>
                 <div className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:border-primary">
                    <RadioGroupItem value="public" id="public"/>
                    <Label htmlFor="public" className="w-full font-normal">
                        <div className="flex items-center gap-3">
                            <Globe className="h-4 w-4" />
                             <div>
                                <p>Public</p>
                                <p className="text-xs text-muted-foreground">Anyone with the link can view.</p>
                            </div>
                        </div>
                    </Label>
                </div>
              </RadioGroup>
          </div>

          <Separator />
          
          <div className="space-y-2">
            <Label className="font-semibold">Invite Collaborator</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting || isSaving}
              />
              <Button onClick={handleInvite} disabled={isInviting || isSaving || !inviteEmail.trim()}>
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="font-semibold">Manage Collaborators</Label>
            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                    {collaborators.map(collaborator => {
                        const isOwner = roles[collaborator.uid] === 'owner';
                        return (
                            <div key={collaborator.uid} className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={collaborator.photoURL || undefined} alt={collaborator.displayName || 'User'}/>
                                    <AvatarFallback>{getInitials(collaborator.displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">{collaborator.displayName || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                                </div>
                                <Select 
                                    value={roles[collaborator.uid]} 
                                    onValueChange={(role) => handleRoleChange(collaborator.uid, role as Role)} 
                                    disabled={isOwner || isSaving}
                                >
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner">Owner</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                                {!isOwner && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleRemoveCollaborator(collaborator.uid)} disabled={isSaving}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
          </div>
        </div>
        
        {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
            </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveChanges} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
