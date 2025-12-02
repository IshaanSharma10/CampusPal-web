import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, provider, db } from '@/FirebaseConfig';
import { toast } from 'sonner';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  profilePic?: string;
  department?: string;
  batch?: string;
  bio?: string;
  interests?: string[];
  createdAt: Date;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // Changed to false for instant load

  async function signup(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    
    const profileData: UserProfile = {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName,
      createdAt: new Date(),
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), profileData);
    toast.success("Account created successfully!");
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
    toast.success("Welcome back!");
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      const profileData: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || 'User',
        photoURL: result.user.photoURL || undefined,
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', result.user.uid), profileData);
    }
    toast.success("Logged in successfully!");
  }

  async function logout() {
    await firebaseSignOut(auth);
    toast.success("Logged out successfully");
  }

  async function updateUserProfile(data: Partial<UserProfile>) {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), data, { merge: true });
    setUserProfile(prev => prev ? { ...prev, ...data } : null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
