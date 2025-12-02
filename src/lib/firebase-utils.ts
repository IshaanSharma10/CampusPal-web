// src/lib/firebase-utils.ts
import { db, storage } from "@/FirebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ============================
// 🔹 Shared Interfaces
// ============================

export interface Post {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  category: "academic" | "events" | "clubs" | "lost-found" | "marketplace" | "fun";
  likes?: string[];
  likeCount?: number;
  commentCount?: number;
  hideLikes?: boolean;
  createdAt?: any;
}

export interface Comment {
  id?: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt?: any;
}

export interface Event {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: any;
  time: string;
  location: string;
  category: "fest" | "workshop" | "webinar" | "club" | "competition" | "other";
  organizerId: string;
  organizerName: string;
  attendees?: string[];
  maxAttendees?: number;
  commentCount?: number;
  createdAt?: any;
}

export interface MarketplaceItem {
  id?: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: "books" | "electronics" | "clothing" | "other";
  condition: "new" | "like-new" | "good" | "fair";
  sellerId: string;
  sellerName: string;
  sellerContact: string;
  sold?: boolean;
  createdAt?: any;
}

export interface StudyMaterial {
  id?: string;
  title: string;
  description: string;
  subject: string;
  fileUrl: string;
  fileType: "pdf" | "doc" | "ppt" | "other";
  uploaderId: string;
  uploaderName: string;
  downloads?: number;
  createdAt?: any;
}

export interface LostFound {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  type: "lost" | "found";
  category: string;
  location: string;
  date: any;
  reporterId: string;
  reporterName: string;
  reporterContact: string;
  resolved?: boolean;
  createdAt?: any;
}

export interface Notification {
  id?: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: "friend_request" | "like" | "comment" | "message";
  message: string;
  content?: string; // for comments or messages
  postId?: string; // for likes and comments
  requestId?: string; // for friend requests
  read: boolean;
  createdAt?: any;
}

export interface FriendRequest {
  id?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  status: "pending" | "accepted" | "declined";
  createdAt?: any;
}

export interface Chat {
  id?: string;
  type: "direct" | "group";
  name?: string; // For group chats
  description?: string; // For group chats
  avatar?: string; // For group chats
  participants: string[]; // User IDs
  participantDetails?: { id: string; name: string; avatar?: string }[]; // For quick access
  createdBy: string;
  createdAt?: any;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: any;
  };
  unreadCount?: { [userId: string]: number };
}

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: "text" | "image" | "file";
  fileUrl?: string;
  fileName?: string;
  createdAt?: any;
  editedAt?: any;
  replyTo?: string; // Message ID being replied to
  deleted?: boolean; // True if message was deleted
  deletedAt?: any; // When the message was deleted
}

// ============================
// 🔹 Helper: Upload Image to Storage
// ============================

export async function uploadImage(file: File, folder: string): Promise<string> {
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// ============================
// 🔹 POSTS
// ============================

export async function createPost(
  post: Omit<Post, "id" | "createdAt" | "likes" | "likeCount" | "commentCount" | "hideLikes">
) {
  const data = {
    ...post,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    hideLikes: false,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, "posts"), data);
}

export async function getPosts(category?: string, limitCount = 20): Promise<Post[]> {
const postsRef = collection(db, "posts");

if (category && category !== "all") {
try {
const q = query(postsRef, where("category", "==", category), orderBy("createdAt", "desc"), limit(limitCount));
      const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Post) }));
  } catch (error: any) {
      console.warn("Composite index error in getPosts, falling back to unordered fetch:", error);
      const q = query(postsRef, where("category", "==", category));
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Post) }));
      // Sort in memory by createdAt desc and limit
      return posts
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime(); // Descending
        })
        .slice(0, limitCount);
    }
  } else {
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Post) }));
  }
}

export async function likePost(postId: string, userId: string, userName: string, userAvatar?: string) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId),
    likeCount: increment(1),
  });

  // Get post author to create notification (don't fail if this fails)
  try {
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      if (post.authorId !== userId) { // Don't notify if liking own post
        await createNotification({
          recipientId: post.authorId,
          senderId: userId,
          senderName: userName,
          senderAvatar: userAvatar,
          type: "like",
          message: `liked your post.`,
          postId: postId,
        });
      }
    }
  } catch (notificationError) {
    console.warn("Failed to create like notification:", notificationError);
    // Don't fail the like if notification creation fails
  }
}

export async function unlikePost(postId: string, userId: string) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    likes: arrayRemove(userId),
    likeCount: increment(-1),
  });
}

export async function updatePost(postId: string, updates: Partial<Pick<Post, "content" | "imageUrl" | "category" | "hideLikes">>) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, updates);
}

export async function deletePost(postId: string) {
  const postRef = doc(db, "posts", postId);
  await deleteDoc(postRef);
}

// ============================
// 🔹 COMMENTS
// ============================

export async function addComment(comment: Omit<Comment, "id" | "createdAt">) {
// Clean the data - remove undefined values (Firestore doesn't accept them)
const cleanComment = Object.fromEntries(
    Object.entries(comment).filter(([_, value]) => value !== undefined)
  );

  const data = { ...cleanComment, createdAt: serverTimestamp() };
  const commentRef = await addDoc(collection(db, "comments"), data);

  // Increment comment count on post
  const postRef = doc(db, "posts", comment.postId);
  await updateDoc(postRef, { commentCount: increment(1) });

  // Get post author to create notification (don't fail if this fails)
  try {
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      if (post.authorId !== comment.authorId) { // Don't notify if commenting on own post
        await createNotification({
          recipientId: post.authorId,
          senderId: comment.authorId,
          senderName: comment.authorName,
          senderAvatar: comment.authorAvatar,
          type: "comment",
          message: `commented: "${comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content}"`,
          content: comment.content,
          postId: comment.postId,
        });
      }
    }
  } catch (notificationError) {
    console.warn("Failed to create comment notification:", notificationError);
    // Don't fail the comment if notification creation fails
  }

  return commentRef;
}

export async function getComments(postId: string): Promise<Comment[]> {
try {
const q = query(
  collection(db, "comments"),
  where("postId", "==", postId),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Comment) }));
  } catch (error: any) {
    // If composite index error, fallback to fetching without ordering
    console.warn("Composite index error, falling back to unordered fetch:", error);
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId)
    );
    const snapshot = await getDocs(q);
    const comments = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Comment) }));
    // Sort in memory by createdAt
    return comments.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return aTime.getTime() - bTime.getTime();
    });
  }
}

export async function updateComment(commentId: string, updates: Partial<Pick<Comment, "content">>) {
  const commentRef = doc(db, "comments", commentId);
  await updateDoc(commentRef, updates);
}

export async function deleteComment(commentId: string) {
  const commentRef = doc(db, "comments", commentId);

  // Get comment data to decrement comment count on post
  const commentSnap = await getDoc(commentRef);
  if (commentSnap.exists()) {
    const comment = commentSnap.data() as Comment;
    const postRef = doc(db, "posts", comment.postId);
    await updateDoc(postRef, { commentCount: increment(-1) });
  }

  await deleteDoc(commentRef);
}

// Event Comments
export async function addEventComment(eventId: string, comment: Omit<Comment, "id" | "createdAt" | "postId">) {
try {
// Clean the data - remove undefined values (Firestore doesn't accept them)
const cleanComment = Object.fromEntries(
      Object.entries(comment).filter(([_, value]) => value !== undefined)
    );

    const data = { ...cleanComment, postId: eventId, createdAt: serverTimestamp() };
    const commentRef = await addDoc(collection(db, "comments"), data);

    // Get event data for comment count update and notification
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    if (eventSnap.exists()) {
      const event = eventSnap.data() as Event;

      // Increment comment count on event
      const currentCount = event.commentCount || 0;
      await updateDoc(eventRef, { commentCount: currentCount + 1 });

      // Create notification for event organizer
      if (event.organizerId !== comment.authorId) { // Don't notify if commenting on own event
        await createNotification({
          recipientId: event.organizerId,
          senderId: comment.authorId,
          senderName: comment.authorName,
          senderAvatar: comment.authorAvatar,
          type: "comment",
          message: `commented on your event "${event.title}": "${comment.content.length > 50 ? comment.content.substring(0, 50) + '...' : comment.content}"`,
          content: comment.content,
          postId: eventId,
        });
      }
    }

    return commentRef;
  } catch (error) {
    console.error("Error in addEventComment:", error);
    throw error;
  }
}

export async function getEventComments(eventId: string): Promise<Comment[]> {
try {
const q = query(
collection(db, "comments"),
where("postId", "==", eventId),
orderBy("createdAt", "asc")
);
const snapshot = await getDocs(q);
return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Comment) }));
} catch (error: any) {
console.warn("Composite index error in getEventComments, falling back to unordered fetch:", error);
try {
    const q = query(
        collection(db, "comments"),
        where("postId", "==", eventId)
      );
      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Comment) }));
      // Sort in memory by createdAt
      return comments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return aTime.getTime() - bTime.getTime();
      });
    } catch (fallbackError) {
      console.error("Error in getEventComments fallback:", fallbackError);
      throw fallbackError;
    }
  }
}

// ============================
// 🔹 EVENTS
// ============================

export async function createEvent(
  event: Omit<Event, "id" | "createdAt" | "attendees" | "commentCount">
) {
  const eventData = {
    ...event,
    imageUrl: event.imageUrl || null,          // ✅ prevent undefined
    maxAttendees: event.maxAttendees ?? null,  // ✅ prevent undefined
    attendees: [],
    commentCount: 0,
    createdAt: Timestamp.now(),
  };

  return addDoc(collection(db, "events"), eventData);
}


export async function getEvents(limitCount = 20): Promise<Event[]> {
  const q = query(collection(db, "events"), orderBy("date", "asc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Event) }));
}

export async function rsvpEvent(eventId: string, userId: string) {
  const eventRef = doc(db, "events", eventId);
  await updateDoc(eventRef, { attendees: arrayUnion(userId) });
}

export async function cancelRsvp(eventId: string, userId: string) {
  const eventRef = doc(db, "events", eventId);
  await updateDoc(eventRef, { attendees: arrayRemove(userId) });
}

// ============================
// 🔹 MARKETPLACE
// ============================

export async function createMarketplaceItem(
  item: Omit<MarketplaceItem, "id" | "createdAt" | "sold">
) {
  const data = {
    ...item,
    sold: false,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, "marketplace"), data);
}

export async function getMarketplaceItems(category?: string): Promise<MarketplaceItem[]> {
const marketplaceRef = collection(db, "marketplace");

if (category && category !== "all") {
try {
const q = query(
marketplaceRef,
where("category", "==", category),
where("sold", "==", false),
orderBy("createdAt", "desc"),
limit(20)
);
const snapshot = await getDocs(q);
return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MarketplaceItem) }));
} catch (error: any) {
console.warn("Composite index error in getMarketplaceItems, falling back to unordered fetch:", error);
const q = query(marketplaceRef, where("category", "==", category), where("sold", "==", false));
      const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MarketplaceItem) }));
    // Sort in memory by createdAt desc and limit
      return items
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime(); // Descending
        })
        .slice(0, 20);
    }
  } else {
    try {
      const q = query(
        marketplaceRef,
        where("sold", "==", false),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MarketplaceItem) }));
    } catch (error: any) {
      console.warn("Composite index error in getMarketplaceItems, falling back to unordered fetch:", error);
      const q = query(marketplaceRef, where("sold", "==", false));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MarketplaceItem) }));
      // Sort in memory by createdAt desc and limit
      return items
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime(); // Descending
        })
        .slice(0, 20);
    }
  }
}

// ============================
// 🔹 STUDY MATERIALS
// ============================

export async function createStudyMaterial(
  material: Omit<StudyMaterial, "id" | "createdAt" | "downloads">
) {
  const data = {
    ...material,
    downloads: 0,
    createdAt: serverTimestamp(),
  };
  return await addDoc(collection(db, "studyMaterials"), data);
}

export async function getStudyMaterials(): Promise<StudyMaterial[]> {
  const q = query(collection(db, "studyMaterials"), orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as StudyMaterial) }));
}

// ============================
// 🔹 LOST & FOUND
// ============================

export async function createLostFoundItem(
  item: Omit<LostFound, "id" | "createdAt" | "resolved">
) {
  const data = {
    ...item,
    resolved: false,
    createdAt: serverTimestamp(),
  };
  // Remove undefined fields to avoid Firestore errors
  Object.keys(data).forEach(key => data[key as keyof typeof data] === undefined && delete data[key as keyof typeof data]);
  return await addDoc(collection(db, "lostFound"), data);
}

export async function getLostFoundItems(type?: "lost" | "found"): Promise<LostFound[]> {
  try {
    const baseRef = collection(db, "lostFound");

    if (type) {
      try {
        const q = query(
          baseRef,
          where("type", "==", type),
          where("resolved", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LostFound) }));
      } catch (error: any) {
        console.warn("Composite index error in getLostFoundItems, falling back to unordered fetch:", error);
        try {
          const q = query(baseRef, where("type", "==", type), where("resolved", "==", false));
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LostFound) }));
          return items
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(0);
              const bTime = b.createdAt?.toDate?.() || new Date(0);
              return bTime.getTime() - aTime.getTime();
            })
            .slice(0, 20);
        } catch (fallbackError) {
          console.error("Error in getLostFoundItems fallback:", fallbackError);
          return [];
        }
      }
    } else {
      try {
        const q = query(
          baseRef,
          where("resolved", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LostFound) }));
      } catch (error: any) {
        console.warn("Composite index error in getLostFoundItems, falling back to unordered fetch:", error);
        try {
          const q = query(baseRef, where("resolved", "==", false));
          const snapshot = await getDocs(q);
          const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LostFound) }));
          return items
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate?.() || new Date(0);
              const bTime = b.createdAt?.toDate?.() || new Date(0);
              return bTime.getTime() - aTime.getTime();
            })
            .slice(0, 20);
        } catch (fallbackError) {
          console.error("Error in getLostFoundItems fallback:", fallbackError);
          return [];
        }
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in getLostFoundItems:", error);
    throw error;
  }
}

export async function markLostFoundResolved(itemId: string) {
  const refDoc = doc(db, "lostFound", itemId);
  await updateDoc(refDoc, { resolved: true });
}

// ============================
// 🔹 FRIEND REQUESTS
// ============================

export async function sendFriendRequest(friendRequest: Omit<FriendRequest, "id" | "createdAt" | "status">) {
  // Validate required fields
  if (!friendRequest.senderId || !friendRequest.recipientId) {
    throw new Error("Missing user IDs");
  }

  // Don't allow self-friend requests
  if (friendRequest.senderId === friendRequest.recipientId) {
    throw new Error("Cannot send friend request to yourself");
  }

  // Check if there's already a pending request between these users
  try {
    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, "friendRequests"),
        where("senderId", "==", friendRequest.senderId),
        where("recipientId", "==", friendRequest.recipientId),
        where("status", "==", "pending"),
        limit(1)
      )),
      getDocs(query(
        collection(db, "friendRequests"),
        where("senderId", "==", friendRequest.recipientId),
        where("recipientId", "==", friendRequest.senderId),
        where("status", "==", "pending"),
        limit(1)
      ))
    ]);
    
    if (!sentSnapshot.empty || !receivedSnapshot.empty) {
      throw new Error("A friend request already exists between these users");
    }
  } catch (checkError: any) {
    // If it's our custom error, re-throw it
    if (checkError.message === "A friend request already exists between these users") {
      throw checkError;
    }
    // Otherwise, log and continue (might be due to permissions)
    console.warn("Could not check for existing requests:", checkError);
  }

  // Prepare data with defaults for optional fields
  const data = {
    senderId: friendRequest.senderId,
    recipientId: friendRequest.recipientId,
    senderName: friendRequest.senderName || "Anonymous",
    recipientName: friendRequest.recipientName || "Unknown",
    senderAvatar: friendRequest.senderAvatar || null,
    recipientAvatar: friendRequest.recipientAvatar || null,
    status: "pending",
    createdAt: serverTimestamp(),
  };
  
  const requestRef = await addDoc(collection(db, "friendRequests"), data);

// Create notification for friend request (optional - don't fail if this fails)
try {
  const notificationData: any = {
    recipientId: friendRequest.recipientId,
    senderId: friendRequest.senderId,
    senderName: friendRequest.senderName,
    type: "friend_request" as const,
    message: "sent you a friend request.",
    requestId: requestRef.id,
  };

  // Only include senderAvatar if it exists
  if (friendRequest.senderAvatar) {
    notificationData.senderAvatar = friendRequest.senderAvatar;
  }

  await createNotification(notificationData);
} catch (notificationError) {
    console.warn("Failed to create notification for friend request:", notificationError);
    // Don't fail the friend request if notification creation fails
  }

  return requestRef;
}

export async function acceptFriendRequest(requestId: string) {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, { status: "accepted" });
}

export async function declineFriendRequest(requestId: string) {
  const requestRef = doc(db, "friendRequests", requestId);
  await updateDoc(requestRef, { status: "declined" });
}

export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, "friendRequests"),
    where("recipientId", "==", userId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as FriendRequest) }));
}

// ============================
// 🔹 NOTIFICATIONS
// ============================

export async function createNotification(notification: Omit<Notification, "id" | "createdAt" | "read">) {
// Clean the data - remove undefined values (Firestore doesn't accept them)
const cleanNotification = Object.fromEntries(
    Object.entries(notification).filter(([_, value]) => value !== undefined)
  );

  const data = { ...cleanNotification, read: false, createdAt: serverTimestamp() };
  return await addDoc(collection(db, "notifications"), data);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const q = query(
    collection(db, "notifications"),
    where("recipientId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Notification) }));
}

export async function markNotificationAsRead(notificationId: string) {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsAsRead(userId: string) {
  const q = query(
    collection(db, "notifications"),
    where("recipientId", "==", userId),
    where("read", "==", false)
  );
  const snapshot = await getDocs(q);
  const batch = [];
  for (const docSnap of snapshot.docs) {
    batch.push(updateDoc(docSnap.ref, { read: true }));
  }
  await Promise.all(batch);
}

// ============================
// 🔹 FRIENDS (ACCEPTED FRIEND REQUESTS)
// ============================

export async function getFriends(userId: string): Promise<{ id: string; name: string; avatar?: string }[]> {
  // Get accepted friend requests where user is sender
  const sentRequests = query(
    collection(db, "friendRequests"),
    where("senderId", "==", userId),
    where("status", "==", "accepted")
  );

  // Get accepted friend requests where user is recipient
  const receivedRequests = query(
    collection(db, "friendRequests"),
    where("recipientId", "==", userId),
    where("status", "==", "accepted")
  );

  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(sentRequests),
    getDocs(receivedRequests)
  ]);

  const friends = new Map<string, { id: string; name: string; avatar?: string }>();

  // Add friends from sent requests
  sentSnapshot.docs.forEach(doc => {
    const data = doc.data() as FriendRequest;
    friends.set(data.recipientId, {
      id: data.recipientId,
      name: data.recipientName,
      avatar: data.recipientAvatar
    });
  });

  // Add friends from received requests
  receivedSnapshot.docs.forEach(doc => {
    const data = doc.data() as FriendRequest;
    friends.set(data.senderId, {
      id: data.senderId,
      name: data.senderName,
      avatar: data.senderAvatar
    });
  });

  return Array.from(friends.values());
}

export async function getRelationshipStatus(currentUserId: string, targetUserId: string): Promise<{
status: "friends" | "pending_sent" | "pending_received" | "none";
requestId?: string;
}> {
try {
  // Check if they're already friends
  const friends = await getFriends(currentUserId);
  const isFriend = friends.some(friend => friend.id === targetUserId);
if (isFriend) {
    return { status: "friends" };
    }

  // Check for pending requests
const sentRequests = query(
  collection(db, "friendRequests"),
  where("senderId", "==", currentUserId),
  where("recipientId", "==", targetUserId),
    where("status", "==", "pending")
    );

const receivedRequests = query(
  collection(db, "friendRequests"),
  where("senderId", "==", targetUserId),
  where("recipientId", "==", currentUserId),
    where("status", "==", "pending")
    );

const [sentSnapshot, receivedSnapshot] = await Promise.all([
  getDocs(sentRequests),
    getDocs(receivedRequests)
    ]);

if (sentSnapshot.docs.length > 0) {
    return { status: "pending_sent", requestId: sentSnapshot.docs[0].id };
    }

if (receivedSnapshot.docs.length > 0) {
    return { status: "pending_received", requestId: receivedSnapshot.docs[0].id };
    }

    return { status: "none" };
  } catch (error) {
    console.warn("Error checking relationship status:", error);
    // Return "none" as fallback to allow friend requests
    return { status: "none" };
  }
}

// ============================
// 🔹 CHATS & MESSAGING
// ============================

export async function createDirectChat(userId1: string, userId2: string): Promise<string> {
  try {
    // Check if direct chat already exists
    const existingChat = await findDirectChat(userId1, userId2);
    if (existingChat) {
      return existingChat.id!;
    }

    // Get user details for participants
    const [user1Details, user2Details] = await Promise.all([
      getUserDetails(userId1),
      getUserDetails(userId2)
    ]);

    // Clean participant details - remove undefined values
    const participantDetails = [
      {
        id: userId1,
        name: user1Details.name,
        ...(user1Details.avatar && { avatar: user1Details.avatar })
      },
      {
        id: userId2,
        name: user2Details.name,
        ...(user2Details.avatar && { avatar: user2Details.avatar })
      }
    ];

    const chatData = {
      type: "direct" as const,
      participants: [userId1, userId2],
      participantDetails,
      createdBy: userId1,
      createdAt: serverTimestamp(),
      unreadCount: { [userId1]: 0, [userId2]: 0 }
    };

    const chatRef = await addDoc(collection(db, "chats"), chatData);
    return chatRef.id;
  } catch (error: any) {
    console.error("Error in createDirectChat:", error);
    throw error;
  }
}

export async function createGroupChat(
  creatorId: string,
  name: string,
  participants: string[],
  description?: string
): Promise<string> {
  // Get participant details
  const rawParticipantDetails = await Promise.all(
    participants.map(id => getUserDetails(id))
  );

  // Clean participant details - remove undefined values
  const participantDetails = rawParticipantDetails.map(detail => ({
    id: detail.id,
    name: detail.name,
    ...(detail.avatar && { avatar: detail.avatar })
  }));

  // Clean the data - remove undefined values (Firestore doesn't accept them)
  const cleanChatData: any = {
    type: "group" as const,
    name,
    participants: [...participants, creatorId], // Include creator
    participantDetails,
    createdBy: creatorId,
    createdAt: serverTimestamp(),
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), { [creatorId]: 0 })
  };

  // Only include description if it exists
  if (description) {
    cleanChatData.description = description;
  }

  const chatRef = await addDoc(collection(db, "chats"), cleanChatData);
  return chatRef.id;
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Chat) }));
}

export async function sendMessage(message: Omit<ChatMessage, "id" | "createdAt">): Promise<string> {
  const messageData = {
    ...message,
    createdAt: serverTimestamp()
  };

  const messageRef = await addDoc(collection(db, "messages"), messageData);

  // Update chat's last message
  const chatRef = doc(db, "chats", message.chatId);
  await updateDoc(chatRef, {
    lastMessage: {
      text: message.content,
      senderId: message.senderId,
      senderName: message.senderName,
      timestamp: serverTimestamp()
    },
    // Increment unread count for other participants
    [`unreadCount.${message.senderId}`]: 0 // Reset sender's unread count
  });

  // Increment unread count for other participants and create notifications
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const chat = chatSnap.data() as Chat;
    const updates: any = {};
    
    chat.participants.forEach(async (participantId) => {
      if (participantId !== message.senderId) {
        const currentCount = chat.unreadCount?.[participantId] || 0;
        updates[`unreadCount.${participantId}`] = currentCount + 1;
        
        // Create notification for new message
        try {
          await createNotification({
            recipientId: participantId,
            senderId: message.senderId,
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            type: "message",
            message: `sent you a message: "${message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content}"`,
            content: message.content,
          });
        } catch (notificationError) {
          console.warn("Failed to create message notification:", notificationError);
        }
      }
    });
    
    await updateDoc(chatRef, updates);
  }

  return messageRef.id;
}

export async function getChatMessages(chatId: string, limitCount = 50): Promise<ChatMessage[]> {
  try {
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as ChatMessage) }));

    // Reverse to show oldest first
    return messages.reverse();
  } catch (error: any) {
    console.error("Error in getChatMessages:", error);
    
    // If it's an index error, provide helpful message
    if (error.message?.includes("index")) {
      console.error("Missing Firestore index for messages collection.");
      console.error("Create index: chatId (Ascending) + createdAt (Descending)");
    }
    
    throw error;
  }
}

export async function markChatAsRead(chatId: string, userId: string) {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${userId}`]: 0
  });
}

// ============================
// 🔹 REAL-TIME LISTENERS
// ============================

export function subscribeToUserChats(
  userId: string, 
  callback: (chats: Chat[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as Chat) 
      }));
      callback(chats);
    },
    (error) => {
      console.error("Error in chats listener:", error);
      if (onError) onError(error as Error);
    }
  );
}

export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
  limitCount = 50
): Unsubscribe {
  const q = query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as ChatMessage) 
      }));
      // Reverse to show oldest first
      callback(messages.reverse());
    },
    (error) => {
      console.error("Error in messages listener:", error);
      if (onError) onError(error as Error);
    }
  );
}

export async function updateChat(chatId: string, updates: Partial<Pick<Chat, "name" | "description" | "avatar">>) {
  const chatRef = doc(db, "chats", chatId);
  await updateDoc(chatRef, updates);
}

export async function addParticipantsToGroup(chatId: string, participantIds: string[]) {
  const chatRef = doc(db, "chats", chatId);

  // Get current chat
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) throw new Error("Chat not found");

  const chat = chatSnap.data() as Chat;
  if (chat.type !== "group") throw new Error("Can only add participants to group chats");

  // Get new participant details
  const rawParticipantDetails = await Promise.all(
    participantIds.map(id => getUserDetails(id))
  );

  // Clean participant details - remove undefined values
  const newParticipantDetails = rawParticipantDetails.map(detail => ({
    id: detail.id,
    name: detail.name,
    ...(detail.avatar && { avatar: detail.avatar })
  }));

  // Update participants and unread counts
  const updatedParticipants = [...chat.participants, ...participantIds];
  const updatedParticipantDetails = [...(chat.participantDetails || []), ...newParticipantDetails];
  const updatedUnreadCount = { ...chat.unreadCount };
  participantIds.forEach(id => {
    updatedUnreadCount[id] = 0;
  });

  await updateDoc(chatRef, {
    participants: updatedParticipants,
    participantDetails: updatedParticipantDetails,
    unreadCount: updatedUnreadCount
  });
}

export async function removeParticipantFromGroup(chatId: string, participantId: string) {
  const chatRef = doc(db, "chats", chatId);

  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) throw new Error("Chat not found");

  const chat = chatSnap.data() as Chat;
  if (chat.type !== "group") throw new Error("Can only remove participants from group chats");

  const updatedParticipants = chat.participants.filter(id => id !== participantId);
  const updatedParticipantDetails = chat.participantDetails?.filter(p => p.id !== participantId);
  const updatedUnreadCount = { ...chat.unreadCount };
  delete updatedUnreadCount[participantId];

  await updateDoc(chatRef, {
    participants: updatedParticipants,
    participantDetails: updatedParticipantDetails,
    unreadCount: updatedUnreadCount
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const messageRef = doc(db, "messages", messageId);
  
  // Get the message to verify ownership
  const messageSnap = await getDoc(messageRef);
  if (!messageSnap.exists()) throw new Error("Message not found");
  
  const message = messageSnap.data() as ChatMessage;
  
  // Only allow sender to delete their own messages
  if (message.senderId !== userId) {
    throw new Error("You can only delete your own messages");
  }
  
  // Mark as deleted instead of removing completely (WhatsApp style)
  await updateDoc(messageRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
    content: "This message was deleted" // Replace content
  });
}

// ============================
// 🔹 HELPERS
// ============================

async function getUserDetails(userId: string): Promise<{ id: string; name: string; avatar?: string }> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const details: { id: string; name: string; avatar?: string } = {
        id: userId,
        name: userData.displayName || userData.email || "Unknown User"
      };
      
      // Only add avatar if it exists
      if (userData.photoURL) {
        details.avatar = userData.photoURL;
      }
      
      return details;
    }
  } catch (error) {
    console.warn("Error fetching user details:", error);
  }
  
  // Fallback if user not found in database
  return {
    id: userId,
    name: "Unknown User"
  };
}

async function findDirectChat(userId1: string, userId2: string): Promise<Chat | null> {
  try {
    const q = query(
      collection(db, "chats"),
      where("type", "==", "direct"),
      where("participants", "array-contains", userId1)
    );

    const snapshot = await getDocs(q);
    for (const doc of snapshot.docs) {
      const chat = { id: doc.id, ...(doc.data() as Chat) };
      if (chat.participants.includes(userId2)) {
        return chat;
      }
    }

    return null;
  } catch (error) {
    console.warn("Error finding direct chat:", error);
    return null;
  }
}
