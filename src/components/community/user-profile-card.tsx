'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Github, Twitter, Globe } from 'lucide-react';
import Link from 'next/link';
import type { UserProfile } from '@/lib/community';

interface UserProfileCardProps {
  profile: UserProfile;
  showStats?: boolean;
}

export function UserProfileCard({ profile, showStats = true }: UserProfileCardProps) {
  return (
    <Card className="border border-gray-200 dark:border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.photoURL || undefined} />
            <AvatarFallback className="text-lg">
              {profile.displayName?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{profile.displayName}</h3>
            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {profile.twitter && (
                <a
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
            {showStats && (
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.projectsCreated}</div>
                  <div className="text-xs text-gray-500">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.projectsCloned}</div>
                  <div className="text-xs text-gray-500">Cloned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.totalLikes}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.totalComments}</div>
                  <div className="text-xs text-gray-500">Comments</div>
                </div>
              </div>
            )}
            {profile.badges && profile.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile.badges.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

