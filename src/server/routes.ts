import { Router, Request, Response } from 'express';
import { store } from './store.ts';
import { UserRole, PropertyType, RoomType, GenderPreference } from './types.ts';

export const apiRouter = Router();

// Current simulated session user (default Aman Sharma, switchable anytime)
let currentUserId = 'user-tenant-aman';

// Middleware to run expiration check on request
apiRouter.use((req, res, next) => {
  store.processListingExpirations();
  next();
});

// ==========================================
// AUTHENTICATION & SESSIONS
// ==========================================

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = store.users.get(currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

apiRouter.get('/auth/demo-users', (req: Request, res: Response) => {
  const users = Array.from(store.users.values());
  return res.json({ users, currentUserId });
});

apiRouter.post('/auth/switch-user', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!store.users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }
  currentUserId = userId;
  return res.json({ success: true, user: store.users.get(currentUserId) });
});

apiRouter.post('/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body as { role: UserRole };
  const user = store.users.get(currentUserId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.roles.includes(role)) {
    user.roles.push(role);
  }
  user.activeRole = role;
  return res.json({ success: true, user });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, username, email, role = 'TENANT', city = 'Indore', locationArea = 'Vijay Nagar', phone } = req.body;

  if (!name || !username || !email) {
    return res.status(400).json({ error: 'Name, username, and email are required' });
  }

  const existing = Array.from(store.users.values()).find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    return res.status(400).json({ error: 'Username or email already in use' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    username: username.toLowerCase().replace(/\s+/g, '_'),
    name,
    email,
    phone,
    avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 1000)}?w=300&auto=format&fit=crop&q=80`,
    bio: `Looking for opportunities and rental community in ${city}.`,
    roles: [role as UserRole],
    activeRole: role as UserRole,
    isVerified: false,
    city,
    locationArea,
    followersCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
  };

  store.users.set(newUser.id, newUser);
  currentUserId = newUser.id;

  return res.status(201).json({ success: true, user: newUser });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { usernameOrEmail } = req.body;
  const user = Array.from(store.users.values()).find(
    (u) =>
      u.username.toLowerCase() === usernameOrEmail?.toLowerCase() ||
      u.email.toLowerCase() === usernameOrEmail?.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  currentUserId = user.id;
  return res.json({ success: true, user });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// FEED (Social + Rental Discovery)
// ==========================================

apiRouter.get('/feed', (req: Request, res: Response) => {
  // Active listings only for feed discovery (Rule 2 & Rule 3)
  const activeListings = Array.from(store.listings.values())
    .filter((l) => l.status === 'ACTIVE')
    .map((l) => {
      const owner = store.users.get(l.ownerId);
      const prop = store.properties.get(l.propertyId);
      const isSaved = store.saves.has(`${currentUserId}:listing:${l.id}`);
      return {
        ...l,
        owner,
        property: prop,
        isSaved,
      };
    });

  // Recent reels
  const reels = Array.from(store.reels.values()).map((r) => {
    const owner = store.users.get(r.ownerId);
    const isLiked = store.likes.has(`${currentUserId}:reel:${r.id}`);
    const isSaved = store.saves.has(`${currentUserId}:reel:${r.id}`);
    return {
      ...r,
      owner,
      isLiked,
      isSaved,
    };
  });

  // Active tenant requirements
  const requirements = Array.from(store.requirements.values())
    .filter((r) => r.status === 'ACTIVE')
    .map((r) => {
      const tenant = store.users.get(r.tenantId);
      return {
        ...r,
        tenant,
      };
    });

  // Regular posts
  const posts = Array.from(store.posts.values()).map((p) => {
    const owner = store.users.get(p.ownerId);
    const isLiked = store.likes.has(`${currentUserId}:post:${p.id}`);
    const isSaved = store.saves.has(`${currentUserId}:post:${p.id}`);
    return {
      ...p,
      owner,
      isLiked,
      isSaved,
    };
  });

  return res.json({
    listings: activeListings,
    reels,
    requirements,
    posts,
  });
});

// ==========================================
// PROPERTIES
// ==========================================

apiRouter.get('/properties', (req: Request, res: Response) => {
  const { city, area, propertyType, minRent, maxRent, genderPreference, noBrokerage } = req.query;

  let list = Array.from(store.properties.values());

  if (city) {
    list = list.filter((p) => p.city.toLowerCase() === String(city).toLowerCase());
  }
  if (area) {
    list = list.filter((p) => p.area.toLowerCase().includes(String(area).toLowerCase()));
  }
  if (propertyType && propertyType !== 'ALL') {
    list = list.filter((p) => p.propertyType === propertyType);
  }
  if (minRent) {
    list = list.filter((p) => p.maxRent >= Number(minRent));
  }
  if (maxRent) {
    list = list.filter((p) => p.minRent <= Number(maxRent));
  }
  if (genderPreference && genderPreference !== 'ANY') {
    list = list.filter((p) => p.genderPreference === genderPreference || p.genderPreference === 'ANY');
  }
  if (noBrokerage === 'true') {
    list = list.filter((p) => p.noBrokerage);
  }

  const enriched = list.map((p) => {
    const owner = store.users.get(p.ownerId);
    const isSaved = store.saves.has(`${currentUserId}:property:${p.id}`);
    return { ...p, owner, isSaved };
  });

  return res.json({ properties: enriched });
});

apiRouter.get('/properties/:id', (req: Request, res: Response) => {
  const prop = store.properties.get(req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const owner = store.users.get(prop.ownerId);
  const rooms = Array.from(store.rooms.values()).filter((r) => r.propertyId === prop.id);
  const activeListings = Array.from(store.listings.values()).filter(
    (l) => l.propertyId === prop.id && l.status === 'ACTIVE'
  );
  const reels = Array.from(store.reels.values()).filter((r) => r.propertyId === prop.id);
  const reviews = Array.from(store.reviews.values()).filter((rv) => rv.propertyId === prop.id);
  const isSaved = store.saves.has(`${currentUserId}:property:${prop.id}`);
  const isFollowing = store.follows.has(`${currentUserId}:${prop.ownerId}`);

  return res.json({
    property: prop,
    owner,
    rooms,
    listings: activeListings,
    reels,
    reviews,
    isSaved,
    isFollowing,
  });
});

apiRouter.post('/properties', (req: Request, res: Response) => {
  const {
    title,
    description,
    propertyType,
    city = 'Indore',
    area,
    fullAddress,
    amenities = [],
    rules = [],
    foodOption,
    genderPreference = 'ANY',
    noBrokerage = true,
    coverPhoto,
    photos = [],
    minRent,
    maxRent,
  } = req.body;

  if (!title || !area) {
    return res.status(400).json({ error: 'Title and area are required' });
  }

  const newProp = {
    id: `prop-${Date.now()}`,
    ownerId: currentUserId,
    title,
    description: description || '',
    propertyType: (propertyType || 'PG') as PropertyType,
    city,
    area,
    fullAddress: fullAddress || `${area}, ${city}`,
    latitude: 22.75 + (Math.random() - 0.5) * 0.08,
    longitude: 75.89 + (Math.random() - 0.5) * 0.08,
    amenities,
    rules,
    foodOption,
    genderPreference: genderPreference as GenderPreference,
    noBrokerage: Boolean(noBrokerage),
    coverPhoto: coverPhoto || (photos[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80'),
    photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80'],
    totalRooms: 1,
    availableRooms: 1,
    minRent: Number(minRent) || 8000,
    maxRent: Number(maxRent) || 12000,
    rating: 5.0,
    reviewCount: 0,
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.properties.set(newProp.id, newProp);

  // Also switch user role to include OWNER if needed
  const user = store.users.get(currentUserId);
  if (user && !user.roles.includes('OWNER') && !user.roles.includes('PG_HOSTEL')) {
    user.roles.push('OWNER');
  }

  return res.status(201).json({ success: true, property: newProp });
});

// ==========================================
// RENTAL LISTINGS (With 10-Day Expiry Engine)
// ==========================================

apiRouter.get('/listings', (req: Request, res: Response) => {
  const { status, ownerId, propertyId, area, city, minRent, maxRent, roomType } = req.query;

  let list = Array.from(store.listings.values());

  // Filter by status (default to ACTIVE unless explicitly requested)
  if (status) {
    if (status !== 'ALL') {
      list = list.filter((l) => l.status === status);
    }
  } else {
    // Public feed default: ACTIVE only
    list = list.filter((l) => l.status === 'ACTIVE');
  }

  if (ownerId) {
    list = list.filter((l) => l.ownerId === ownerId);
  }
  if (propertyId) {
    list = list.filter((l) => l.propertyId === propertyId);
  }
  if (area) {
    list = list.filter((l) => l.area.toLowerCase().includes(String(area).toLowerCase()));
  }
  if (city) {
    list = list.filter((l) => l.city.toLowerCase() === String(city).toLowerCase());
  }
  if (minRent) {
    list = list.filter((l) => l.rent >= Number(minRent));
  }
  if (maxRent) {
    list = list.filter((l) => l.rent <= Number(maxRent));
  }
  if (roomType && roomType !== 'ALL') {
    list = list.filter((l) => l.roomType === roomType);
  }

  const enriched = list.map((l) => {
    const owner = store.users.get(l.ownerId);
    const prop = store.properties.get(l.propertyId);
    const isSaved = store.saves.has(`${currentUserId}:listing:${l.id}`);
    return { ...l, owner, property: prop, isSaved };
  });

  return res.json({ listings: enriched });
});

apiRouter.get('/listings/:id', (req: Request, res: Response) => {
  const listing = store.listings.get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Increment view
  listing.viewsCount += 1;

  const owner = store.users.get(listing.ownerId);
  const property = store.properties.get(listing.propertyId);
  const isSaved = store.saves.has(`${currentUserId}:listing:${listing.id}`);

  return res.json({ listing, owner, property, isSaved });
});

apiRouter.post('/listings', (req: Request, res: Response) => {
  const {
    propertyId,
    roomId,
    title,
    description,
    rent,
    deposit,
    propertyType = 'PG',
    roomType = 'SINGLE',
    city = 'Indore',
    area = 'Vijay Nagar',
    photos = [],
    amenities = [],
    genderPreference = 'ANY',
  } = req.body;

  if (!title || !rent) {
    return res.status(400).json({ error: 'Title and rent are required' });
  }

  const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const newListing = {
    id: `list-${now}`,
    propertyId: propertyId || 'prop-custom',
    roomId,
    ownerId: currentUserId,
    title,
    description: description || '',
    rent: Number(rent),
    deposit: Number(deposit || rent),
    propertyType: propertyType as PropertyType,
    roomType: roomType as RoomType,
    city,
    area,
    photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80'],
    amenities,
    genderPreference: genderPreference as GenderPreference,
    status: 'ACTIVE' as const,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TEN_DAYS_MS).toISOString(), // Exactly 10 days!
    viewsCount: 0,
    inquiriesCount: 0,
    savesCount: 0,
    isFeatured: false,
  };

  store.listings.set(newListing.id, newListing);

  // Send creation confirmation notification
  store.addNotification({
    userId: currentUserId,
    type: 'LISTING_RENEWED',
    title: 'New Room Listing Published 🚀',
    message: `"${title}" is live for 10 days. It will expire on ${new Date(now + TEN_DAYS_MS).toLocaleDateString()}.`,
    linkUrl: `/listings/${newListing.id}`,
    metadata: { listingId: newListing.id },
  });

  return res.status(201).json({ success: true, listing: newListing });
});

// Renew expired listing for another 10 days (Rule 5)
apiRouter.post('/listings/:id/renew', (req: Request, res: Response) => {
  const listing = store.renewListing(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  return res.json({ success: true, listing, message: 'Listing renewed for 10 days!' });
});

// Mark listing as RENTED (Rule 3)
apiRouter.post('/listings/:id/mark-rented', (req: Request, res: Response) => {
  const listing = store.markListingRented(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  return res.json({ success: true, listing, message: 'Room marked as rented and removed from discovery.' });
});

// Pause listing
apiRouter.post('/listings/:id/pause', (req: Request, res: Response) => {
  const listing = store.pauseListing(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  return res.json({ success: true, listing });
});

// ==========================================
// TENANT RENTAL REQUIREMENTS (Side 2 Discovery)
// ==========================================

apiRouter.get('/requirements', (req: Request, res: Response) => {
  const { city, area, occupation, budgetMax, status } = req.query;

  let list = Array.from(store.requirements.values());

  if (status && status !== 'ALL') {
    list = list.filter((r) => r.status === status);
  } else if (!status) {
    list = list.filter((r) => r.status === 'ACTIVE');
  }

  if (city) {
    list = list.filter((r) => r.city.toLowerCase() === String(city).toLowerCase());
  }
  if (area) {
    list = list.filter((r) =>
      r.preferredAreas.some((a) => a.toLowerCase().includes(String(area).toLowerCase()))
    );
  }
  if (occupation && occupation !== 'ALL') {
    list = list.filter((r) => r.occupation === occupation);
  }
  if (budgetMax) {
    list = list.filter((r) => r.budgetMin <= Number(budgetMax));
  }

  const enriched = list.map((r) => {
    const tenant = store.users.get(r.tenantId);
    return { ...r, tenant };
  });

  return res.json({ requirements: enriched });
});

apiRouter.post('/requirements', (req: Request, res: Response) => {
  const {
    title,
    city = 'Indore',
    preferredAreas = ['Vijay Nagar'],
    budgetMin = 7000,
    budgetMax = 10000,
    propertyTypes = ['PG', 'ROOM'],
    roomTypes = ['SINGLE'],
    moveInDate = 'Immediately',
    occupation = 'STUDENT',
    genderPreference = 'ANY',
    preferences = [],
    description,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newReq = {
    id: `req-${Date.now()}`,
    tenantId: currentUserId,
    title,
    city,
    preferredAreas,
    budgetMin: Number(budgetMin),
    budgetMax: Number(budgetMax),
    propertyTypes,
    roomTypes,
    moveInDate,
    occupation,
    genderPreference,
    preferences,
    description: description || '',
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
    viewsCount: 0,
  };

  store.requirements.set(newReq.id, newReq);

  // Trigger matches check
  return res.status(201).json({ success: true, requirement: newReq });
});

// Requirement Matching Engine
apiRouter.get('/requirements/:id/matches', (req: Request, res: Response) => {
  const requirement = store.requirements.get(req.params.id);
  if (!requirement) return res.status(404).json({ error: 'Requirement not found' });

  const activeProperties = Array.from(store.properties.values());
  const activeListings = Array.from(store.listings.values()).filter((l) => l.status === 'ACTIVE');

  const matches = activeProperties.map((prop) => {
    const propListing = activeListings.find((l) => l.propertyId === prop.id);
    const scoreResult = store.calculateMatchScore(prop, requirement, propListing);
    const owner = store.users.get(prop.ownerId);
    return {
      ...scoreResult,
      owner,
    };
  });

  // Sort by highest match score
  matches.sort((a, b) => b.score - a.score);

  return res.json({ requirement, matches });
});

// ==========================================
// PROPERTY REELS
// ==========================================

apiRouter.get('/reels', (req: Request, res: Response) => {
  const { category, ownerId } = req.query;

  let list = Array.from(store.reels.values());

  if (category && category !== 'ALL') {
    list = list.filter((r) => r.category === category);
  }
  if (ownerId) {
    list = list.filter((r) => r.ownerId === ownerId);
  }

  const enriched = list.map((r) => {
    const owner = store.users.get(r.ownerId);
    const isLiked = store.likes.has(`${currentUserId}:reel:${r.id}`);
    const isSaved = store.saves.has(`${currentUserId}:reel:${r.id}`);
    return { ...r, owner, isLiked, isSaved };
  });

  return res.json({ reels: enriched });
});

apiRouter.post('/reels', (req: Request, res: Response) => {
  const {
    propertyId,
    listingId,
    videoUrl,
    thumbnailUrl,
    caption,
    location = 'Indore',
    propertyTitle,
    rentAmount,
    category = 'ROOM_TOUR',
  } = req.body;

  if (!videoUrl || !caption) {
    return res.status(400).json({ error: 'Video URL and caption are required' });
  }

  const newReel = {
    id: `reel-${Date.now()}`,
    ownerId: currentUserId,
    propertyId,
    listingId,
    videoUrl,
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop&q=80',
    caption,
    location,
    propertyTitle: propertyTitle || 'Exclusive Rental Tour',
    rentAmount: rentAmount ? Number(rentAmount) : undefined,
    category: category as any,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    viewsCount: 1,
    createdAt: new Date().toISOString(),
  };

  store.reels.set(newReel.id, newReel);

  return res.status(201).json({ success: true, reel: newReel });
});

apiRouter.post('/reels/:id/like', (req: Request, res: Response) => {
  const reel = store.reels.get(req.params.id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });

  const key = `${currentUserId}:reel:${reel.id}`;
  const isLiked = store.likes.has(key);

  if (isLiked) {
    store.likes.delete(key);
    reel.likesCount = Math.max(0, reel.likesCount - 1);
  } else {
    store.likes.add(key);
    reel.likesCount += 1;
  }

  return res.json({ success: true, isLiked: !isLiked, likesCount: reel.likesCount });
});

apiRouter.get('/reels/:id/comments', (req: Request, res: Response) => {
  const comments = Array.from(store.comments.values()).filter(
    (c) => c.targetId === req.params.id && c.targetType === 'REEL'
  );
  return res.json({ comments });
});

apiRouter.post('/reels/:id/comments', (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });

  const reel = store.reels.get(req.params.id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });

  const user = store.users.get(currentUserId);
  const comment = {
    id: `comm-${Date.now()}`,
    targetId: reel.id,
    targetType: 'REEL' as const,
    userId: currentUserId,
    userName: user?.name || 'User',
    userAvatar: user?.avatar || '',
    text,
    createdAt: new Date().toISOString(),
  };

  store.comments.set(comment.id, comment);
  reel.commentsCount += 1;

  return res.status(201).json({ success: true, comment });
});

// ==========================================
// SOCIAL ACTIONS (Save, Follow, User Profile)
// ==========================================

apiRouter.post('/social/save', (req: Request, res: Response) => {
  const { targetType, targetId } = req.body as { targetType: 'listing' | 'property' | 'reel' | 'post'; targetId: string };
  const key = `${currentUserId}:${targetType}:${targetId}`;
  const isSaved = store.saves.has(key);

  if (isSaved) {
    store.saves.delete(key);
  } else {
    store.saves.add(key);
  }

  return res.json({ success: true, isSaved: !isSaved });
});

apiRouter.get('/social/saved', (req: Request, res: Response) => {
  const savedListingIds: string[] = [];
  const savedPropertyIds: string[] = [];
  const savedReelIds: string[] = [];

  store.saves.forEach((val) => {
    const [uid, type, id] = val.split(':');
    if (uid === currentUserId) {
      if (type === 'listing') savedListingIds.push(id);
      if (type === 'property') savedPropertyIds.push(id);
      if (type === 'reel') savedReelIds.push(id);
    }
  });

  const listings = savedListingIds.map((id) => store.listings.get(id)).filter(Boolean);
  const properties = savedPropertyIds.map((id) => store.properties.get(id)).filter(Boolean);
  const reels = savedReelIds.map((id) => store.reels.get(id)).filter(Boolean);

  return res.json({ listings, properties, reels });
});

apiRouter.post('/users/:id/follow', (req: Request, res: Response) => {
  const targetId = req.params.id;
  const targetUser = store.users.get(targetId);
  const currentUser = store.users.get(currentUserId);

  if (!targetUser || !currentUser) return res.status(404).json({ error: 'User not found' });

  const key = `${currentUserId}:${targetId}`;
  const isFollowing = store.follows.has(key);

  if (isFollowing) {
    store.follows.delete(key);
    targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
    currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
  } else {
    store.follows.add(key);
    targetUser.followersCount += 1;
    currentUser.followingCount += 1;

    store.addNotification({
      userId: targetId,
      type: 'NEW_FOLLOWER',
      title: 'New Follower 👤',
      message: `${currentUser.name} started following your profile.`,
      linkUrl: `/users/${currentUser.username}`,
    });
  }

  return res.json({ success: true, isFollowing: !isFollowing, followersCount: targetUser.followersCount });
});

// Instagram-Style Profile Details
apiRouter.get('/users/:username', (req: Request, res: Response) => {
  const user = Array.from(store.users.values()).find(
    (u) => u.username.toLowerCase() === req.params.username.toLowerCase()
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  const isFollowing = store.follows.has(`${currentUserId}:${user.id}`);
  const properties = Array.from(store.properties.values()).filter((p) => p.ownerId === user.id);
  const listings = Array.from(store.listings.values()).filter((l) => l.ownerId === user.id);
  const reels = Array.from(store.reels.values()).filter((r) => r.ownerId === user.id);
  const requirements = Array.from(store.requirements.values()).filter((r) => r.tenantId === user.id);
  const posts = Array.from(store.posts.values()).filter((p) => p.ownerId === user.id);

  // Property reviews if owner
  const propertyIds = new Set(properties.map((p) => p.id));
  const reviews = Array.from(store.reviews.values()).filter((rv) => propertyIds.has(rv.propertyId));

  return res.json({
    user,
    isFollowing,
    properties,
    listings,
    reels,
    requirements,
    posts,
    reviews,
  });
});

// ==========================================
// MESSAGING & INSTAGRAM-STYLE CHAT
// ==========================================

apiRouter.get('/conversations', (req: Request, res: Response) => {
  const list = Array.from(store.conversations.values())
    .filter((c) => c.participants.includes(currentUserId))
    .map((c) => {
      const otherUserId = c.participants.find((id) => id !== currentUserId) || c.participants[0];
      const otherUser = store.users.get(otherUserId);
      return {
        ...c,
        otherUser,
        unreadCount: c.unreadCount[currentUserId] || 0,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return res.json({ conversations: list });
});

apiRouter.post('/conversations', (req: Request, res: Response) => {
  const { targetUserId, context } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

  const conversation = store.findOrCreateConversation(currentUserId, targetUserId, context);
  const otherUser = store.users.get(targetUserId);

  return res.json({ conversation, otherUser });
});

apiRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversation = store.conversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

  // Mark messages as read
  conversation.unreadCount[currentUserId] = 0;

  const messages = Array.from(store.messages.values())
    .filter((m) => m.conversationId === req.params.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const otherUserId = conversation.participants.find((id) => id !== currentUserId) || conversation.participants[0];
  const otherUser = store.users.get(otherUserId);

  return res.json({
    conversation,
    otherUser,
    messages,
  });
});

apiRouter.post('/messages', (req: Request, res: Response) => {
  const { conversationId, receiverId, text, context, imageUrl } = req.body;
  if (!conversationId || !receiverId || !text) {
    return res.status(400).json({ error: 'conversationId, receiverId, and text are required' });
  }

  const message = store.sendMessage({
    conversationId,
    senderId: currentUserId,
    receiverId,
    text,
    context,
    imageUrl,
  });

  return res.status(201).json({ success: true, message });
});

// ==========================================
// NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const list = Array.from(store.notifications.values())
    .filter((n) => n.userId === currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = list.filter((n) => !n.isRead).length;

  return res.json({ notifications: list, unreadCount });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = store.notifications.get(req.params.id);
  if (notif) notif.isRead = true;
  return res.json({ success: true });
});

apiRouter.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  store.notifications.forEach((n) => {
    if (n.userId === currentUserId) n.isRead = true;
  });
  return res.json({ success: true });
});

// ==========================================
// SEARCH (Unified Global Search)
// ==========================================

apiRouter.get('/search', (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const tab = String(req.query.tab || 'all');

  if (!q) {
    return res.json({ properties: [], listings: [], users: [], reels: [], requirements: [] });
  }

  const matchedProperties = Array.from(store.properties.values()).filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.propertyType.toLowerCase().includes(q)
  );

  const matchedListings = Array.from(store.listings.values()).filter(
    (l) =>
      l.status === 'ACTIVE' &&
      (l.title.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.roomType.toLowerCase().includes(q))
  );

  const matchedUsers = Array.from(store.users.values()).filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.locationArea.toLowerCase().includes(q) ||
      (u.bio && u.bio.toLowerCase().includes(q))
  );

  const matchedReels = Array.from(store.reels.values()).filter(
    (r) =>
      r.caption.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      (r.propertyTitle && r.propertyTitle.toLowerCase().includes(q))
  );

  const matchedRequirements = Array.from(store.requirements.values()).filter(
    (req) =>
      req.status === 'ACTIVE' &&
      (req.title.toLowerCase().includes(q) ||
        req.preferredAreas.some((a) => a.toLowerCase().includes(q)) ||
        req.description.toLowerCase().includes(q))
  );

  return res.json({
    properties: matchedProperties,
    listings: matchedListings,
    users: matchedUsers,
    reels: matchedReels,
    requirements: matchedRequirements,
  });
});

// ==========================================
// ADMIN & DASHBOARDS
// ==========================================

apiRouter.get('/admin/metrics', (req: Request, res: Response) => {
  const allListings = Array.from(store.listings.values());
  const activeListings = allListings.filter((l) => l.status === 'ACTIVE').length;
  const expiredListings = allListings.filter((l) => l.status === 'EXPIRED').length;
  const rentedListings = allListings.filter((l) => l.status === 'RENTED').length;

  const totalUsers = store.users.size;
  const totalProperties = store.properties.size;
  const totalReels = store.reels.size;
  const totalRequirements = store.requirements.size;
  const totalInquiries = Array.from(store.conversations.values()).length;

  return res.json({
    activeListings,
    expiredListings,
    rentedListings,
    totalUsers,
    totalProperties,
    totalReels,
    totalRequirements,
    totalInquiries,
    dailyActiveUsers: Math.floor(totalUsers * 0.72) + 14,
    reportedContent: 0,
    systemStatus: 'HEALTHY',
    city: 'Indore',
  });
});
