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
  const q =
    category && category !== "all"
      ? query(postsRef, where("category", "==", category), orderBy("createdAt", "desc"), limit(limitCount))
      : query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Post) }));
}

export async function likePost(postId: string, userId: string, userName: string, userAvatar?: string) {
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId),
    likeCount: increment(1),
  });

  // Get post author to create notification
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
  const data = { ...comment, createdAt: serverTimestamp() };
  const commentRef = await addDoc(collection(db, "comments"), data);

  // Increment comment count on post
  const postRef = doc(db, "posts", comment.postId);
  await updateDoc(postRef, { commentCount: increment(1) });

  // Get post author to create notification
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

  return commentRef;
}

export async function getComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Comment) }));
}

// Event Comments
export async function addEventComment(eventId: string, comment: Omit<Comment, "id" | "createdAt" | "postId">) {
  try {
    const data = { ...comment, postId: eventId, createdAt: serverTimestamp() };
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
  } catch (error) {
    console.error("Error in getEventComments:", error);
    throw error;
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
  const q =
    category && category !== "all"
      ? query(
          marketplaceRef,
          where("category", "==", category),
          where("sold", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        )
      : query(
          marketplaceRef,
          where("sold", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as MarketplaceItem) }));
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
  return await addDoc(collection(db, "lostFound"), data);
}

export async function getLostFoundItems(type?: "lost" | "found"): Promise<LostFound[]> {
  const baseRef = collection(db, "lostFound");
  const q =
    type
      ? query(
          baseRef,
          where("type", "==", type),
          where("resolved", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        )
      : query(
          baseRef,
          where("resolved", "==", false),
          orderBy("createdAt", "desc"),
          limit(20)
        );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LostFound) }));
}

export async function markLostFoundResolved(itemId: string) {
  const refDoc = doc(db, "lostFound", itemId);
  await updateDoc(refDoc, { resolved: true });
}

// ============================
// 🔹 FRIEND REQUESTS
// ============================

export async function sendFriendRequest(friendRequest: Omit<FriendRequest, "id" | "createdAt" | "status">) {
  const data = { ...friendRequest, status: "pending", createdAt: serverTimestamp() };
  const requestRef = await addDoc(collection(db, "friendRequests"), data);

  // Create notification for friend request
  await createNotification({
    recipientId: friendRequest.recipientId,
    senderId: friendRequest.senderId,
    senderName: friendRequest.senderName,
    senderAvatar: friendRequest.senderAvatar,
    type: "friend_request",
    message: "sent you a friend request.",
    requestId: requestRef.id,
  });

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
  const data = { ...notification, read: false, createdAt: serverTimestamp() };
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
