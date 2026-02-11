import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ForumCategory, ForumTopic, ForumPost } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  MessageSquare, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  MessageCircle, 
  HelpCircle,
  ChevronLeft,
  Eye,
  Plus,
  Pin,
  Lock,
  Heart,
  LogIn
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  TrendingUp,
  BarChart3,
  Settings,
  MessageCircle,
  HelpCircle,
  MessageSquare,
};

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return past.toLocaleDateString();
}

function UserAvatar({ name, imageUrl, size = 'md' }: { name?: string; imageUrl?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={name || 'User'} 
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/10`}
      />
    );
  }

  const initial = name?.[0]?.toUpperCase() || 'A';
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-white/10`}>
      {initial}
    </div>
  );
}

export default function Forum() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newReply, setNewReply] = useState('');

  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['/api/forum/categories'],
  });

  const { data: topics = [] } = useQuery<ForumTopic[]>({
    queryKey: ['/api/forum/topics', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/forum/topics?categoryId=${selectedCategory}` 
        : '/api/forum/topics';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load topics');
      return res.json();
    },
  });

  const { data: currentTopic } = useQuery<ForumTopic>({
    queryKey: ['/api/forum/topics', selectedTopic],
    queryFn: async () => {
      const res = await fetch(`/api/forum/topics/${selectedTopic}`);
      if (!res.ok) throw new Error('Failed to load topic');
      return res.json();
    },
    enabled: !!selectedTopic,
  });

  const { data: posts = [] } = useQuery<ForumPost[]>({
    queryKey: ['/api/forum/topics', selectedTopic, 'posts'],
    queryFn: async () => {
      const res = await fetch(`/api/forum/topics/${selectedTopic}/posts`);
      if (!res.ok) throw new Error('Failed to load posts');
      return res.json();
    },
    enabled: !!selectedTopic,
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: { categoryId: number; title: string; content: string }) => {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create topic');
      }
      return res.json();
    },
    onSuccess: (topic) => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/categories'] });
      setShowNewTopicForm(false);
      setNewTopicTitle('');
      setNewTopicContent('');
      setSelectedTopic(topic.id);
      toast.success("Thread posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: async (data: { topicId: number; content: string }) => {
      const res = await fetch(`/api/forum/topics/${data.topicId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to post reply');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics', selectedTopic, 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics'] });
      setNewReply('');
      toast.success("Reply posted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const upvoteTopicMutation = useMutation({
    mutationFn: async (topicId: number) => {
      const res = await fetch(`/api/forum/topics/${topicId}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to like');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics', selectedTopic] });
    },
  });

  const upvotePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/forum/posts/${postId}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to like');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/topics', selectedTopic, 'posts'] });
    },
  });

  const handleCreateTopic = () => {
    if (!selectedCategory || !newTopicTitle.trim() || !newTopicContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to post");
      return;
    }
    createTopicMutation.mutate({
      categoryId: selectedCategory,
      title: newTopicTitle,
      content: newTopicContent,
    });
  };

  const handleCreateReply = () => {
    if (!selectedTopic || !newReply.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please sign in to reply");
      return;
    }
    createReplyMutation.mutate({
      topicId: selectedTopic,
      content: newReply,
    });
  };

  const displayName = user?.firstName 
    ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
    : user?.email?.split('@')[0] || 'Anonymous';

  // Login prompt component
  const LoginPrompt = ({ action = "participate" }: { action?: string }) => (
    <Card className="glass-modern p-6 text-center border-primary/20">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <LogIn className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-display text-white mb-2">Sign in to {action}</h3>
      <p className="text-sm text-white/50 mb-4">Join the community to post threads, reply, and interact with other traders</p>
      <Button
        onClick={() => window.location.href = '/api/login'}
        className="h-12 px-8 font-display text-[10px] tracking-[0.5em] bg-primary hover:bg-primary/80 text-black uppercase rounded-none"
        data-testid="button-login-prompt"
      >
        Sign In
      </Button>
    </Card>
  );

  // Topic Detail View (Threads-style)
  if (selectedTopic && currentTopic) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <button 
          onClick={() => setSelectedTopic(null)}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          data-testid="button-back-to-topics"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Original Thread */}
        <div className="border-b border-white/5 pb-6">
          <div className="flex gap-3">
            <UserAvatar 
              name={currentTopic.authorName} 
              imageUrl={currentTopic.authorAvatar} 
              size="md" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">{currentTopic.authorName}</span>
                <span className="text-white/40 text-sm">· {formatTimeAgo(currentTopic.createdAt)}</span>
                {currentTopic.isPinned && <Pin className="h-3 w-3 text-amber-400" />}
                {currentTopic.isLocked && <Lock className="h-3 w-3 text-red-400" />}
              </div>
              <h2 className="text-xl font-display font-bold text-white mb-3">{currentTopic.title}</h2>
              <p className="text-white/80 whitespace-pre-wrap text-[15px] leading-relaxed">{currentTopic.content}</p>
              
              {currentTopic.tags && currentTopic.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {currentTopic.tags.map((tag: string) => (
                    <span key={tag} className="text-[11px] px-2 py-1 bg-primary/10 text-primary rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 mt-4 text-white/40">
                <button
                  onClick={() => upvoteTopicMutation.mutate(currentTopic.id)}
                  className="flex items-center gap-2 hover:text-red-400 transition-colors"
                  data-testid="button-like-topic"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm">{currentTopic.upvotes}</span>
                </button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm">{currentTopic.replyCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">{currentTopic.viewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-0">
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className={`py-4 ${index < posts.length - 1 ? 'border-b border-white/5' : ''}`}
              data-testid={`post-${post.id}`}
            >
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <UserAvatar 
                    name={post.authorName} 
                    imageUrl={post.authorAvatar} 
                    size="sm" 
                  />
                  {index < posts.length - 1 && (
                    <div className="w-0.5 flex-1 bg-white/10 mt-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">{post.authorName}</span>
                    <span className="text-white/40 text-xs">· {formatTimeAgo(post.createdAt)}</span>
                    {post.isAnswer && (
                      <span className="text-[9px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                        Best Answer
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-[14px] whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-white/40">
                    <button
                      onClick={() => upvotePostMutation.mutate(post.id)}
                      className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
                      data-testid={`button-like-post-${post.id}`}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-xs">{post.upvotes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {!currentTopic.isLocked && (
          isAuthenticated ? (
            <div className="flex gap-3 pt-4 border-t border-white/5">
              <UserAvatar 
                name={displayName} 
                imageUrl={user?.profileImageUrl} 
                size="sm" 
              />
              <div className="flex-1">
                <Textarea
                  placeholder="Reply to this thread..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="bg-transparent border-white/10 min-h-[80px] rounded-xl text-sm resize-none focus:ring-primary"
                  data-testid="input-reply-content"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleCreateReply}
                    disabled={createReplyMutation.isPending || !newReply.trim()}
                    className="h-9 px-6 font-display text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/80 text-black uppercase rounded-full"
                    data-testid="button-submit-reply"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <LoginPrompt action="reply" />
          )
        )}
      </div>
    );
  }

  // Topics List View
  if (selectedCategory) {
    const category = categories.find(c => c.id === selectedCategory);
    
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setSelectedCategory(null);
              setShowNewTopicForm(false);
            }}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            data-testid="button-back-to-categories"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          {isAuthenticated && (
            <Button
              onClick={() => setShowNewTopicForm(!showNewTopicForm)}
              className="h-9 font-display text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/80 text-black uppercase rounded-full"
              data-testid="button-new-topic"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Thread
            </Button>
          )}
        </div>

        <div className="text-center pb-4 border-b border-white/5">
          <h2 className="text-2xl font-display font-bold text-white">{category?.name}</h2>
          <p className="text-sm text-white/50 mt-1">{category?.description}</p>
        </div>

        {/* New Topic Form */}
        {showNewTopicForm && isAuthenticated && (
          <div className="flex gap-3 p-4 bg-white/[0.02] rounded-xl border border-primary/20">
            <UserAvatar 
              name={displayName} 
              imageUrl={user?.profileImageUrl} 
              size="md" 
            />
            <div className="flex-1 space-y-3">
              <Input
                placeholder="Thread title"
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="bg-transparent border-white/10 h-10 rounded-lg text-sm"
                data-testid="input-topic-title"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newTopicContent}
                onChange={(e) => setNewTopicContent(e.target.value)}
                className="bg-transparent border-white/10 min-h-[100px] rounded-lg text-sm resize-none"
                data-testid="input-topic-content"
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowNewTopicForm(false)}
                  className="h-9 px-4 text-xs bg-white/5 hover:bg-white/10 text-white/60 rounded-full"
                  data-testid="button-cancel-topic"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTopic}
                  disabled={createTopicMutation.isPending}
                  className="h-9 px-6 font-display text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/80 text-black uppercase rounded-full"
                  data-testid="button-submit-topic"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && !showNewTopicForm && (
          <LoginPrompt action="start a thread" />
        )}

        {/* Topics List (Threads-style) */}
        <div className="space-y-0">
          {topics.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-sm">No threads yet. Be the first to start a discussion!</p>
            </div>
          ) : (
            topics.map((topic, index) => (
              <div 
                key={topic.id}
                className={`py-4 cursor-pointer hover:bg-white/[0.02] -mx-4 px-4 transition-colors ${index < topics.length - 1 ? 'border-b border-white/5' : ''}`}
                onClick={() => setSelectedTopic(topic.id)}
                data-testid={`topic-${topic.id}`}
              >
                <div className="flex gap-3">
                  <UserAvatar 
                    name={topic.authorName} 
                    imageUrl={topic.authorAvatar} 
                    size="md" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{topic.authorName}</span>
                      <span className="text-white/40 text-xs">· {formatTimeAgo(topic.createdAt)}</span>
                      {topic.isPinned && <Pin className="h-3 w-3 text-amber-400" />}
                      {topic.isLocked && <Lock className="h-3 w-3 text-red-400" />}
                    </div>
                    <h3 className="font-display text-white font-medium mb-1">{topic.title}</h3>
                    <p className="text-white/50 text-sm line-clamp-2">{topic.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5" />
                        {topic.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {topic.replyCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {topic.viewCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Categories View (default) - Threads-style home
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* User header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-display font-black tracking-tighter text-gradient uppercase">Community</h2>
          <p className="text-xs text-white/40 mt-1">Connect with traders worldwide</p>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <UserAvatar 
              name={displayName} 
              imageUrl={user?.profileImageUrl} 
              size="md" 
            />
            <div className="text-right">
              <div className="text-sm font-medium text-white">{displayName}</div>
              <button 
                onClick={() => window.location.href = '/api/logout'}
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => window.location.href = '/api/login'}
            className="h-9 px-6 font-display text-[10px] tracking-[0.3em] bg-primary hover:bg-primary/80 text-black uppercase rounded-full"
            data-testid="button-login-header"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon || 'MessageSquare'] || MessageSquare;
          return (
            <div
              key={category.id}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`category-${category.id}`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-white font-medium group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-white/40">{category.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-display text-white/60">{category.topicCount || 0}</div>
                <div className="text-[9px] text-white/30 uppercase">threads</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Threads */}
      {topics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-display uppercase tracking-[0.4em] text-white/40">
            Latest Threads
          </h3>
          <div className="space-y-0">
            {topics.slice(0, 5).map((topic, index) => (
              <div 
                key={topic.id}
                className={`py-4 cursor-pointer hover:bg-white/[0.02] -mx-4 px-4 transition-colors ${index < 4 && topics.length > index + 1 ? 'border-b border-white/5' : ''}`}
                onClick={() => {
                  setSelectedCategory(topic.categoryId);
                  setSelectedTopic(topic.id);
                }}
                data-testid={`recent-topic-${topic.id}`}
              >
                <div className="flex gap-3">
                  <UserAvatar 
                    name={topic.authorName} 
                    imageUrl={topic.authorAvatar} 
                    size="sm" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm">{topic.authorName}</span>
                      <span className="text-white/40 text-xs">· {formatTimeAgo(topic.createdAt)}</span>
                    </div>
                    <h4 className="text-white text-sm truncate">{topic.title}</h4>
                    <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {topic.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {topic.replyCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
