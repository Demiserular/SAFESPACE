
import { Post, Comment, Reaction, Report } from './types'; // Assuming you have a types file

const API_BASE_URL = '/api';

// Posts
export const getPosts = async (): Promise<Post[]> => {
  const response = await fetch(`${API_BASE_URL}/posts`);
  return response.json();
};

export const getPost = async (id: string): Promise<Post> => {
  const response = await fetch(`${API_BASE_URL}/posts/${id}`);
  return response.json();
};

export const createPost = async (post: Partial<Post>): Promise<Post> => {
  // Get auth token from Supabase
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(post),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create post')
  }
  return response.json();
};

export const updatePost = async (id: string, post: Partial<Post>): Promise<Post> => {
  // Get auth token from Supabase
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(post),
  });
  return response.json();
};

export const deletePost = async (id: string): Promise<void> => {
  // Get auth token from Supabase
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  await fetch(`${API_BASE_URL}/posts/${id}`, {
    method: 'DELETE',
    headers
  });
};

// Comments
export const getComments = async (postId: string): Promise<Comment[]> => {
  const response = await fetch(`${API_BASE_URL}/comments?post_id=${postId}`);

  if (!response.ok) {
    console.error('Failed to fetch comments:', response.status, response.statusText);
    return []; // Return empty array on error
  }

  const text = await response.text();
  if (!text) {
    return []; // Return empty array if response is empty
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse comments JSON:', error);
    return []; // Return empty array on parse error
  }
};

export const createComment = async (comment: Partial<Comment>): Promise<Comment> => {
  // Get auth token from Supabase
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(comment),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create comment');
  }

  return response.json();
};

export const updateComment = async (id: string, comment: Partial<Comment>): Promise<Comment> => {
  const response = await fetch(`${API_BASE_URL}/comments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment),
  });
  return response.json();
};

export const deleteComment = async (id: string): Promise<void> => {
  await fetch(`${API_BASE_URL}/comments/${id}`, { method: 'DELETE' });
};

// Reactions
export const getReactions = async (postId?: string, commentId?: string): Promise<Reaction[]> => {
  const url = postId ? `${API_BASE_URL}/reactions?post_id=${postId}` : `${API_BASE_URL}/reactions?comment_id=${commentId}`;
  const response = await fetch(url);
  return response.json();
};

export const getReactionsCount = async (postId?: string, commentId?: string): Promise<{ count: number }> => {
  const url = postId ? `${API_BASE_URL}/reactions?post_id=${postId}&count=true` : `${API_BASE_URL}/reactions?comment_id=${commentId}&count=true`;
  const response = await fetch(url);
  return response.json();
}

export const createReaction = async (reaction: Partial<Reaction>): Promise<Reaction> => {
  const response = await fetch(`${API_BASE_URL}/reactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reaction),
  });
  return response.json();
};

export const deleteReaction = async (reaction: Partial<Reaction>): Promise<void> => {
  await fetch(`${API_BASE_URL}/reactions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reaction),
  });
};

// Reports
export const getReports = async (postId?: string, commentId?: string): Promise<Report[]> => {
  const url = postId ? `${API_BASE_URL}/reports?post_id=${postId}` : `${API_BASE_URL}/reports?comment_id=${commentId}`;
  const response = await fetch(url);
  return response.json();
};

export const getReportsCount = async (postId?: string, commentId?: string): Promise<{ count: number }> => {
  const url = postId ? `${API_BASE_URL}/reports?post_id=${postId}&count=true` : `${API_BASE_URL}/reports?comment_id=${commentId}&count=true`;
  const response = await fetch(url);
  return response.json();
}

export const createReport = async (report: Partial<Report>): Promise<Report> => {
  // Get auth token from Supabase
  const { supabase } = await import('../lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    headers,
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create report')
  }

  return response.json();
};
