
'use client';

import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, MessageSquare, User as UserIcon, LayoutDashboard, Rocket, CreditCard, KeyIcon, PlusCircle, Crown, Shield } from 'lucide-react';
import { useState } from 'react';
import { FeedbackDialog } from './feedback-dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function UserNav() {
  const { user, signOut, subscriptionPlan, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  }

  const handleManageSubscription = async () => {
    // This function is now just a convenient way to navigate
    router.push('/profile/subscription');
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            {subscriptionPlan === 'plus' && (
               <div className="absolute bottom-5 left-6 h-5.9 w-5.9 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
               <PlusCircle className="w-5.9 h-5.9" />
             </div>
             
            )}
            {subscriptionPlan === 'pro' && (
                 <div className="absolute bottom-5 left-6 h-5.9 w-5.9 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white flex items-center justify-center border-2 border-background">
                    <Crown className="w-5.9 h-5.9" />
                </div>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </DropdownMenuItem>
          )}
           <DropdownMenuItem onClick={() => router.push('/profile/details')}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageSubscription}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Subscription</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/profile/change-password')}>
              <KeyIcon className="mr-2 h-4 w-4" />
              <span>Change Password</span>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => router.push('/community')}>
            <Rocket className="mr-2 h-4 w-4" />
            <span>Community</span>
          </DropdownMenuItem>
           <DropdownMenuItem onClick={() => setIsFeedbackDialogOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Feedback</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <FeedbackDialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen} />
    </>
  );
}
