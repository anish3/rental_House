import {
  User,
  Property,
  Room,
  RentalListing,
  RentalRequirement,
  Reel,
  Post,
  Comment,
  Review,
  Conversation,
  Message,
  Notification,
  MatchScoreResult,
  MessageContext,
} from './types.ts';
import {
  seedUsers,
  seedProperties,
  seedRooms,
  seedListings,
  seedRequirements,
  seedReels,
  seedPosts,
  seedComments,
  seedReviews,
  seedConversations,
  seedMessages,
  seedNotifications,
} from './data/seed.ts';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

class RentReelStore {
  public users: Map<string, User> = new Map();
  public properties: Map<string, Property> = new Map();
  public rooms: Map<string, Room> = new Map();
  public listings: Map<string, RentalListing> = new Map();
  public requirements: Map<string, RentalRequirement> = new Map();
  public reels: Map<string, Reel> = new Map();
  public posts: Map<string, Post> = new Map();
  public comments: Map<string, Comment> = new Map();
  public reviews: Map<string, Review> = new Map();
  public conversations: Map<string, Conversation> = new Map();
  public messages: Map<string, Message> = new Map();
  public notifications: Map<string, Notification> = new Map();

  // Social relations
  public likes: Set<string> = new Set(); // format: `${userId}:${targetId}`
  public saves: Set<string> = new Set(); // format: `${userId}:${targetId}`
  public follows: Set<string> = new Set(); // format: `${followerId}:${targetUserId}`

  private notifiedExpiringSoon: Set<string> = new Set();
  private notifiedExpired: Set<string> = new Set();

  constructor() {
    this.seedInitialData();
    this.startExpirationWorker();
  }

  private seedInitialData() {
    seedUsers.forEach((u) => this.users.set(u.id, { ...u }));
    seedProperties.forEach((p) => this.properties.set(p.id, { ...p }));
    seedRooms.forEach((r) => this.rooms.set(r.id, { ...r }));
    seedListings.forEach((l) => this.listings.set(l.id, { ...l }));
    seedRequirements.forEach((req) => this.requirements.set(req.id, { ...req }));
    seedReels.forEach((r) => this.reels.set(r.id, { ...r }));
    seedPosts.forEach((p) => this.posts.set(p.id, { ...p }));
    seedComments.forEach((c) => this.comments.set(c.id, { ...c }));
    seedReviews.forEach((rv) => this.reviews.set(rv.id, { ...rv }));
    seedConversations.forEach((conv) => this.conversations.set(conv.id, { ...conv }));
    seedMessages.forEach((m) => this.messages.set(m.id, { ...m }));
    seedNotifications.forEach((n) => this.notifications.set(n.id, { ...n }));

    // Seed sample follows
    this.follows.add('user-tenant-aman:user-owner-abc');
    this.follows.add('user-tenant-priya:user-broker-shivam');

    // Run first expiration check
    this.processListingExpirations();
  }

  // 10-day Automatic Server-Side Expiration background worker
  private startExpirationWorker() {
    setInterval(() => {
      this.processListingExpirations();
    }, 30000); // Check every 30 seconds
  }

  public processListingExpirations(): void {
    const now = Date.now();

    for (const listing of this.listings.values()) {
      if (listing.status === 'ACTIVE') {
        const expiryTime = new Date(listing.expiresAt).getTime();

        // Check if listing has expired
        if (expiryTime <= now) {
          listing.status = 'EXPIRED';

          if (!this.notifiedExpired.has(listing.id)) {
            this.notifiedExpired.add(listing.id);
            this.addNotification({
              userId: listing.ownerId,
              type: 'LISTING_EXPIRED',
              title: 'Room Listing Expired ⚠️',
              message: `Your listing "${listing.title}" expired after 10 days. Renew now to reactivate discovery.`,
              linkUrl: `/listings/${listing.id}`,
              metadata: { listingId: listing.id },
            });
          }
        }
        // Check if expiring in less than 24 hours
        else if (expiryTime - now <= ONE_DAY_MS && !this.notifiedExpiringSoon.has(listing.id)) {
          this.notifiedExpiringSoon.add(listing.id);
          this.addNotification({
            userId: listing.ownerId,
            type: 'EXPIRING_SOON',
            title: 'Your Room Listing Expires Tomorrow! ⏳',
            message: `Is "${listing.title}" still available? Renew it for 10 days or mark as rented.`,
            linkUrl: `/listings/${listing.id}`,
            metadata: { listingId: listing.id },
          });
        }
      }
    }
  }

  // Listing Operations
  public renewListing(listingId: string): RentalListing | null {
    const listing = this.listings.get(listingId);
    if (!listing) return null;

    listing.status = 'ACTIVE';
    listing.renewedAt = new Date().toISOString();
    listing.expiresAt = new Date(Date.now() + TEN_DAYS_MS).toISOString();
    this.notifiedExpired.delete(listingId);
    this.notifiedExpiringSoon.delete(listingId);

    this.addNotification({
      userId: listing.ownerId,
      type: 'LISTING_RENEWED',
      title: 'Listing Renewed for 10 Days 🎉',
      message: `"${listing.title}" is now active in feeds and discovery for the next 10 days!`,
      linkUrl: `/listings/${listing.id}`,
      metadata: { listingId: listing.id },
    });

    return listing;
  }

  public markListingRented(listingId: string): RentalListing | null {
    const listing = this.listings.get(listingId);
    if (!listing) return null;

    listing.status = 'RENTED';
    listing.rentedAt = new Date().toISOString();

    // If property available rooms > 0, decrement
    const prop = this.properties.get(listing.propertyId);
    if (prop && prop.availableRooms > 0) {
      prop.availableRooms -= 1;
    }

    return listing;
  }

  public pauseListing(listingId: string): RentalListing | null {
    const listing = this.listings.get(listingId);
    if (!listing) return null;
    listing.status = 'PAUSED';
    return listing;
  }

  // Match Scoring Algorithm
  public calculateMatchScore(
    property: Property,
    requirement: RentalRequirement,
    listing?: RentalListing
  ): MatchScoreResult {
    let score = 0;
    const matchedCriteria: string[] = [];
    const unmatchedCriteria: string[] = [];

    // 1. Location match (30 points)
    const areaMatches =
      requirement.preferredAreas.length === 0 ||
      requirement.preferredAreas.some(
        (a) => a.toLowerCase().includes(property.area.toLowerCase()) || property.area.toLowerCase().includes(a.toLowerCase())
      );
    if (areaMatches) {
      score += 30;
      matchedCriteria.push(`Location (${property.area})`);
    } else {
      unmatchedCriteria.push(`Location is outside ${requirement.preferredAreas.join(', ')}`);
    }

    // 2. Budget match (25 points)
    const rentToCheck = listing ? listing.rent : property.minRent;
    if (rentToCheck <= requirement.budgetMax) {
      score += 25;
      matchedCriteria.push(`Budget within ₹${requirement.budgetMax.toLocaleString('en-IN')}`);
    } else if (rentToCheck <= requirement.budgetMax * 1.15) {
      score += 15;
      matchedCriteria.push(`Slightly above budget (₹${rentToCheck.toLocaleString('en-IN')})`);
    } else {
      unmatchedCriteria.push(`Rent ₹${rentToCheck.toLocaleString('en-IN')} exceeds budget`);
    }

    // 3. Property Type match (20 points)
    if (
      requirement.propertyTypes.length === 0 ||
      requirement.propertyTypes.includes(property.propertyType)
    ) {
      score += 20;
      matchedCriteria.push(`Property Type (${property.propertyType})`);
    } else {
      unmatchedCriteria.push(`Type is ${property.propertyType}`);
    }

    // 4. Gender match (15 points)
    if (
      property.genderPreference === 'ANY' ||
      requirement.genderPreference === 'ANY' ||
      property.genderPreference === requirement.genderPreference
    ) {
      score += 15;
      matchedCriteria.push(`Gender preference (${property.genderPreference})`);
    } else {
      unmatchedCriteria.push(`Gender restriction (${property.genderPreference})`);
    }

    // 5. Amenities / Preferences match (10 points)
    const matchedPrefs = (requirement.preferences || []).filter((pref) =>
      property.amenities.some((amenity) => amenity.toLowerCase() === pref.toLowerCase())
    );
    if (matchedPrefs.length > 0) {
      score += Math.min(10, matchedPrefs.length * 3);
      matchedCriteria.push(`Amenities (${matchedPrefs.join(', ')})`);
    }

    score = Math.min(100, Math.round(score));

    return {
      property,
      listing,
      requirement,
      score,
      matchedCriteria,
      unmatchedCriteria,
    };
  }

  // Notifications
  public addNotification(
    data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>
  ): Notification {
    const notif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(notif.id, notif);
    return notif;
  }

  // Messaging & Conversations
  public findOrCreateConversation(
    user1Id: string,
    user2Id: string,
    context?: MessageContext
  ): Conversation {
    const existing = Array.from(this.conversations.values()).find(
      (c) =>
        c.participants.includes(user1Id) &&
        c.participants.includes(user2Id) &&
        c.participants.length === 2
    );

    if (existing) {
      if (context) {
        existing.activeContext = context;
      }
      return existing;
    }

    const newConv: Conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      participants: [user1Id, user2Id],
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [user1Id]: 0, [user2Id]: 0 },
      activeContext: context,
    };
    this.conversations.set(newConv.id, newConv);
    return newConv;
  }

  public sendMessage(params: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
    context?: MessageContext;
    imageUrl?: string;
  }): Message {
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      conversationId: params.conversationId,
      senderId: params.senderId,
      receiverId: params.receiverId,
      text: params.text,
      context: params.context,
      imageUrl: params.imageUrl,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.messages.set(msg.id, msg);

    // Update conversation
    const conv = this.conversations.get(params.conversationId);
    if (conv) {
      conv.lastMessage = params.text;
      conv.lastMessageAt = msg.createdAt;
      conv.unreadCount[params.receiverId] = (conv.unreadCount[params.receiverId] || 0) + 1;
      if (params.context) {
        conv.activeContext = params.context;
      }
    }

    // Trigger notification for recipient
    const sender = this.users.get(params.senderId);
    this.addNotification({
      userId: params.receiverId,
      type: 'NEW_MESSAGE',
      title: `Message from ${sender?.name || 'User'} 💬`,
      message: params.text.slice(0, 80),
      linkUrl: `/messages?conv=${params.conversationId}`,
      metadata: { conversationId: params.conversationId, senderId: params.senderId },
    });

    return msg;
  }
}

export const store = new RentReelStore();
