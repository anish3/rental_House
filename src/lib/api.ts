import {
  User,
  Property,
  RentalListing,
  RentalRequirement,
  Reel,
  Post,
  Comment,
  Conversation,
  Message,
  Notification,
  UserRole,
} from '../types/client.ts';

const BASE_URL = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  getCurrentUser: () => fetchJson<{ user: User }>('/auth/me'),
  getDemoUsers: () => fetchJson<{ users: User[]; currentUserId: string }>('/auth/demo-users'),
  switchUser: (userId: string) =>
    fetchJson<{ success: boolean; user: User }>('/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  switchRole: (role: UserRole) =>
    fetchJson<{ success: boolean; user: User }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  // Feed
  getFeed: () =>
    fetchJson<{
      listings: RentalListing[];
      reels: Reel[];
      requirements: RentalRequirement[];
      posts: Post[];
    }>('/feed'),

  // Properties
  getProperties: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson<{ properties: Property[] }>(`/properties${query ? `?${query}` : ''}`);
  },
  getPropertyById: (id: string) =>
    fetchJson<{
      property: Property;
      owner: User;
      rooms: any[];
      listings: RentalListing[];
      reels: Reel[];
      reviews: any[];
      isSaved: boolean;
      isFollowing: boolean;
    }>(`/properties/${id}`),
  createProperty: (data: Partial<Property>) =>
    fetchJson<{ success: boolean; property: Property }>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Listings (with 10-day lifecycle)
  getListings: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson<{ listings: RentalListing[] }>(`/listings${query ? `?${query}` : ''}`);
  },
  getListingById: (id: string) =>
    fetchJson<{
      listing: RentalListing;
      owner: User;
      property: Property;
      isSaved: boolean;
    }>(`/listings/${id}`),
  createListing: (data: Partial<RentalListing>) =>
    fetchJson<{ success: boolean; listing: RentalListing }>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  renewListing: (id: string) =>
    fetchJson<{ success: boolean; listing: RentalListing; message: string }>(`/listings/${id}/renew`, {
      method: 'POST',
    }),
  markListingRented: (id: string) =>
    fetchJson<{ success: boolean; listing: RentalListing; message: string }>(`/listings/${id}/mark-rented`, {
      method: 'POST',
    }),
  pauseListing: (id: string) =>
    fetchJson<{ success: boolean; listing: RentalListing }>(`/listings/${id}/pause`, {
      method: 'POST',
    }),

  // Requirements (Tenant discovery)
  getRequirements: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchJson<{ requirements: RentalRequirement[] }>(`/requirements${query ? `?${query}` : ''}`);
  },
  createRequirement: (data: Partial<RentalRequirement>) =>
    fetchJson<{ success: boolean; requirement: RentalRequirement }>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRequirementMatches: (id: string) =>
    fetchJson<{
      requirement: RentalRequirement;
      matches: Array<{
        property: Property;
        listing?: RentalListing;
        score: number;
        matchedCriteria: string[];
        unmatchedCriteria: string[];
        owner: User;
      }>;
    }>(`/requirements/${id}/matches`),

  // Reels
  getReels: (category?: string) => {
    const query = category ? `?category=${category}` : '';
    return fetchJson<{ reels: Reel[] }>(`/reels${query}`);
  },
  createReel: (data: Partial<Reel>) =>
    fetchJson<{ success: boolean; reel: Reel }>('/reels', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  likeReel: (id: string) =>
    fetchJson<{ success: boolean; isLiked: boolean; likesCount: number }>(`/reels/${id}/like`, {
      method: 'POST',
    }),
  getReelComments: (id: string) => fetchJson<{ comments: Comment[] }>(`/reels/${id}/comments`),
  addReelComment: (id: string, text: string) =>
    fetchJson<{ success: boolean; comment: Comment }>(`/reels/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Social & Profiles
  getUserProfile: (username: string) =>
    fetchJson<{
      user: User;
      isFollowing: boolean;
      properties: Property[];
      listings: RentalListing[];
      reels: Reel[];
      requirements: RentalRequirement[];
      posts: Post[];
      reviews: any[];
    }>(`/users/${username}`),
  toggleFollow: (userId: string) =>
    fetchJson<{ success: boolean; isFollowing: boolean; followersCount: number }>(`/users/${userId}/follow`, {
      method: 'POST',
    }),
  toggleSave: (targetType: 'listing' | 'property' | 'reel' | 'post', targetId: string) =>
    fetchJson<{ success: boolean; isSaved: boolean }>('/social/save', {
      method: 'POST',
      body: JSON.stringify({ targetType, targetId }),
    }),
  getSavedItems: () =>
    fetchJson<{
      listings: RentalListing[];
      properties: Property[];
      reels: Reel[];
    }>('/social/saved'),

  // Messages
  getConversations: () => fetchJson<{ conversations: Conversation[] }>('/conversations'),
  startConversation: (targetUserId: string, context?: any) =>
    fetchJson<{ conversation: Conversation; otherUser: User }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, context }),
    }),
  getMessages: (conversationId: string) =>
    fetchJson<{
      conversation: Conversation;
      otherUser: User;
      messages: Message[];
    }>(`/conversations/${conversationId}/messages`),
  sendMessage: (data: {
    conversationId: string;
    receiverId: string;
    text: string;
    context?: any;
    imageUrl?: string;
  }) =>
    fetchJson<{ success: boolean; message: Message }>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getNotifications: () => fetchJson<{ notifications: Notification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    fetchJson<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    fetchJson<{ success: boolean }>('/notifications/mark-all-read', { method: 'POST' }),

  // Search
  searchGlobal: (query: string, tab = 'all') =>
    fetchJson<{
      properties: Property[];
      listings: RentalListing[];
      users: User[];
      reels: Reel[];
      requirements: RentalRequirement[];
    }>(`/search?q=${encodeURIComponent(query)}&tab=${tab}`),

  // Admin
  getAdminMetrics: () => fetchJson<any>('/admin/metrics'),
};
