import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '@/FirebaseConfig';
import { storage } from '@/FirebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface Club {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category?: string;
  imageUrl?: string;
  instagram?: string;
  website?: string;
}

export interface ClubMember {
  id?: string;
  clubId: string;
  userId: string;
  userName: string;
  joinedAt: Date;
}

export interface ClubPost {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  postImage?: string;
  likes: number;
  likedBy?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile } = useAuth();

  // Fetch all clubs
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const clubsRef = collection(db, 'clubs');
        const snapshot = await getDocs(clubsRef);
        
        const clubsList: Club[] = [];
        snapshot.forEach((doc) => {
          clubsList.push({
            id: doc.id,
            ...doc.data(),
          } as Club);
        });
        
        setClubs(clubsList);
      } catch (error) {
        console.error('Error fetching clubs:', error);
      }
    };

    fetchClubs();
  }, []);

  // Fetch user's joined clubs
  useEffect(() => {
    if (!currentUser) {
      setJoinedClubs([]);
      setLoading(false);
      return;
    }

    const fetchJoinedClubs = async () => {
      try {
        const membersRef = collection(db, 'clubMembers');
        const q = query(membersRef, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        
        const joined: string[] = [];
        snapshot.forEach((doc) => {
          joined.push(doc.data().clubId);
        });
        
        setJoinedClubs(joined);
      } catch (error) {
        console.error('Error fetching joined clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedClubs();
  }, [currentUser]);

  const joinClub = async (clubId: string, clubName: string) => {
    if (!currentUser || !userProfile) {
      toast.error('Please log in to join clubs');
      return;
    }

    // Check if already joined
    if (joinedClubs.includes(clubId)) {
      toast.error('You have already joined this club');
      return;
    }

    try {
      // Add member record
      const membersRef = collection(db, 'clubMembers');
      await addDoc(membersRef, {
        clubId,
        userId: currentUser.uid,
        userName: userProfile.displayName,
        joinedAt: serverTimestamp(),
      });

      // Increment club member count
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        memberCount: increment(1),
      });

      setJoinedClubs([...joinedClubs, clubId]);
      toast.success(`Joined ${clubName}!`);
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club');
    }
  };

  const leaveClub = async (clubId: string, clubName: string) => {
    if (!currentUser) return;

    try {
      // Find and delete member record
      const membersRef = collection(db, 'clubMembers');
      const q = query(
        membersRef, 
        where('clubId', '==', clubId),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Decrement club member count
      const clubRef = doc(db, 'clubs', clubId);
      await updateDoc(clubRef, {
        memberCount: increment(-1),
      });

      setJoinedClubs(joinedClubs.filter(id => id !== clubId));
      toast.success(`Left ${clubName}`);
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave club');
    }
  };

  const getClubMembers = async (clubId: string): Promise<ClubMember[]> => {
    try {
      const membersRef = collection(db, 'clubMembers');
      const q = query(membersRef, where('clubId', '==', clubId));
      const snapshot = await getDocs(q);
      
      const members: ClubMember[] = [];
      snapshot.forEach((doc) => {
        members.push({
          id: doc.id,
          ...doc.data(),
        } as ClubMember);
      });
      
      return members;
    } catch (error) {
      console.error('Error fetching club members:', error);
      return [];
    }
  };

  const getClubPosts = async (clubId: string): Promise<ClubPost[]> => {
    try {
      const postsRef = collection(db, 'clubPosts');
      const q = query(postsRef, where('clubId', '==', clubId));
      const snapshot = await getDocs(q);
      
      const posts: ClubPost[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          clubId: data.clubId,
          userId: data.userId,
          userName: data.userName || 'Unknown User',
          userPhoto: data.userPhoto || '',
          content: data.content,
          postImage: data.postImage || undefined,
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || undefined,
        } as ClubPost);
      });
      
      return posts.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error fetching club posts:', error);
      return [];
    }
  };

  const postToClub = async (clubId: string, content: string, imageFile?: File) => {
    if (!currentUser || !userProfile) {
      toast.error('Please log in to post');
      return;
    }

    try {
      let postImageUrl: string | undefined;

      if (imageFile) {
        // Compress image before uploading
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };

        try {
          const compressedFile = await imageCompression(imageFile, options);
          const timestamp = Date.now();
          const storageRef = ref(
            storage,
            `clubPosts/${clubId}/${currentUser.uid}_${timestamp}`
          );
          
          await uploadBytes(storageRef, compressedFile);
          postImageUrl = await getDownloadURL(storageRef);
        } catch (compressError) {
          console.error('Image compression error:', compressError);
          toast.error('Failed to process image');
          return;
        }
      }

      const postsRef = collection(db, 'clubPosts');
      const postData = {
        clubId,
        userId: currentUser.uid,
        userName: userProfile.displayName || 'Unknown User',
        userPhoto: userProfile.photoURL || '',
        content,
        postImage: postImageUrl || null,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      };

      await addDoc(postsRef, postData);

      toast.success('Post shared!');
    } catch (error) {
      console.error('Error posting to club:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Permission denied')) {
          toast.error('Permission denied. Please try again.');
        } else {
          toast.error('Failed to share post: ' + error.message);
        }
      } else {
        toast.error('Failed to share post');
      }
    }
  };

  const likePost = async (clubId: string, postId: string) => {
    if (!currentUser) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const postRef = doc(db, 'clubPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        toast.error('Post not found');
        return;
      }

      const postData = postSnap.data();
      const likedBy = postData.likedBy || [];
      const userIndex = likedBy.indexOf(currentUser.uid);

      if (userIndex > -1) {
        // Unlike
        likedBy.splice(userIndex, 1);
        await updateDoc(postRef, {
          likedBy,
          likes: increment(-1),
        });
        toast.success('Post unliked');
      } else {
        // Like
        likedBy.push(currentUser.uid);
        await updateDoc(postRef, {
          likedBy,
          likes: increment(1),
        });
        toast.success('Post liked');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const editPost = async (clubId: string, postId: string, newContent: string) => {
    if (!currentUser) {
      toast.error('Please log in to edit posts');
      return;
    }

    try {
      const postRef = doc(db, 'clubPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        toast.error('Post not found');
        return;
      }

      const postData = postSnap.data();
      if (postData.userId !== currentUser.uid) {
        toast.error('You can only edit your own posts');
        return;
      }

      await updateDoc(postRef, {
        content: newContent,
        updatedAt: serverTimestamp(),
      });

      toast.success('Post updated');
    } catch (error) {
      console.error('Error editing post:', error);
      toast.error('Failed to edit post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUser) {
      toast.error('Please log in to delete posts');
      return;
    }

    try {
      const postRef = doc(db, 'clubPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        toast.error('Post not found');
        return;
      }

      const postData = postSnap.data();
      if (postData.userId !== currentUser.uid) {
        toast.error('You can only delete your own posts');
        return;
      }

      await deleteDoc(postRef);
      toast.success('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

   return {
     clubs,
     joinedClubs,
     loading,
     joinClub,
     leaveClub,
     getClubMembers,
     getClubPosts,
     postToClub,
     likePost,
     editPost,
     deletePost,
   };
  }
