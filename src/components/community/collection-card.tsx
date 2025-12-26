'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import type { ProjectCollection } from '@/lib/community';

interface CollectionCardProps {
  collection: ProjectCollection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link href={`/collections/${collection.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              {collection.description && (
                <CardDescription className="mt-2 line-clamp-2">
                  {collection.description}
                </CardDescription>
              )}
            </div>
            <FolderOpen className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={collection.userPhotoURL || undefined} />
              <AvatarFallback>{collection.userDisplayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {collection.userDisplayName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{collection.projectIds.length} projects</span>
              {collection.followerCount !== undefined && collection.followerCount > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{collection.followerCount}</span>
                </div>
              )}
            </div>
            {collection.isPublic && (
              <Badge variant="secondary">Public</Badge>
            )}
          </div>
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {collection.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

