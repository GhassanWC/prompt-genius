'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { auth } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Comment } from '@/lib/community';

interface CommentsSectionProps {
  projectId: string;
}

export function CommentsSection({ projectId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/community/comments?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          content: newComment,
          parentCommentId: replyingTo || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to post comment');
      }

      setNewComment('');
      setReplyingTo(null);
      loadComments();
      toast({
        title: 'Comment posted',
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/community/comments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          commentId,
          content: editContent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to edit comment');
      }

      setEditingId(null);
      setEditContent('');
      loadComments();
      toast({
        title: 'Comment updated',
      });
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to edit comment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/community/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }

      loadComments();
      toast({
        title: 'Comment deleted',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete comment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);
  const replies = comments.filter(c => c.parentCommentId);

  const getReplies = (commentId: string) => {
    return replies.filter(r => r.parentCommentId === commentId);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.uid === comment.userId;
    const isEditing = editingId === comment.id;
    const commentReplies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.userPhotoURL || undefined} />
            <AvatarFallback>{comment.userDisplayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{comment.userDisplayName}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingId(null);
                    setEditContent('');
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{comment.content}</p>
                <div className="flex items-center gap-4">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReplyingTo(comment.id);
                        setReplyContent('');
                      }}
                      className="text-xs"
                    >
                      Reply
                    </Button>
                  )}
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(comment.id);
                            setEditContent(comment.content);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {replyingTo === comment.id && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        if (!replyContent.trim()) return;
                        setLoading(true);
                        try {
                          const token = await auth.currentUser?.getIdToken();
                          const res = await fetch('/api/community/comments', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({
                              projectId,
                              content: replyContent,
                              parentCommentId: comment.id,
                            }),
                          });
                          if (res.ok) {
                            setReplyContent('');
                            setReplyingTo(null);
                            loadComments();
                          }
                        } finally {
                          setLoading(false);
                        }
                      }}>
                        Post Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
            {commentReplies.map(reply => renderComment(reply, true))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {user ? (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px]"
          />
          <Button onClick={handleSubmitComment} disabled={loading || !newComment.trim()}>
            <Send className="mr-2 h-4 w-4" />
            Post Comment
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Sign in to comment</p>
      )}

      <div className="space-y-4 mt-6">
        {topLevelComments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
        ) : (
          topLevelComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  );
}

