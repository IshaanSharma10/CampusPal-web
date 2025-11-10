import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Heart, MessageCircle, Share2, Camera } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { db, auth } from "@/FirebaseConfig";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Post } from "@/lib/firebase-utils";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../SupabaseConfig";

interface UserProfile {
  displayName: string;
  username?: string;
  email?: string;
  bio?: string;
  department?: string;
  year?: string;
  profilePic?: string;
  photoURL?: string;
}

export default function Profile() {
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [otherUsers, setOtherUsers] = useState<UserProfile[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // ✅ Load user profile from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserProfile);
        } else {
          const defaultData: UserProfile = {
            displayName: user.displayName || "New User",
            username: user.email?.split("@")[0],
            email: user.email || "",
            bio: "",
            department: "",
            year: "",
            profilePic: user.photoURL || "",
          };
          await setDoc(userRef, defaultData);
          setUserData(defaultData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error loading profile",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  // ✅ Load user posts
  useEffect(() => {
    const loadUserPosts = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const postsRef = collection(db, "posts");
        try {
          const q = query(
            postsRef,
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(10)
          );
          const snapshot = await getDocs(q);
          const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];
          setUserPosts(posts);
        } catch (indexError: any) {
          console.warn("Composite index missing:", indexError.message);
          const q = query(postsRef, where("authorId", "==", user.uid), limit(20));
          const snapshot = await getDocs(q);
          const posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Post[];

          posts.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          setUserPosts(posts.slice(0, 10));
        }
      } catch (error) {
        console.error("Error loading posts:", error);
        toast({
          title: "Error loading posts",
          description: "Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingPosts(false);
      }
    };

    loadUserPosts();
  }, [toast]);

  // ✅ Load other users
  useEffect(() => {
    const loadOtherUsers = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(8));
        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map((doc) => doc.data() as UserProfile)
          .filter((u) => u.email !== user.email);
        setOtherUsers(users.slice(0, 4));
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadOtherUsers();
  }, []);

  // ✅ Handle image selection
  const handleImageSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum size allowed is 2 MB.",
        variant: "destructive",
      });
      return;
    }
    setNewProfilePic(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ✅ Save changes and upload to Supabase
  const handleSave = async () => {
    try {
      setSaving(true);
      const user = auth.currentUser;
      if (!user || !userData) return;

      const userRef = doc(db, "users", user.uid);
      const updates: Partial<UserProfile> = {
        bio: userData.bio || "",
        department: userData.department || "",
        year: userData.year || "",
      };

      if (newProfilePic) {
  const fileExt = newProfilePic.name.split(".").pop();
  const fileName = `${user.uid}_${Date.now()}.${fileExt}`;
  const filePath = `profile-pics/${fileName}`;

  // ✅ Upload to Supabase
  const { error: uploadError } = await supabase.storage
    .from("user_profile")
    .upload(filePath, newProfilePic, { upsert: true });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError.message);
    toast({
      title: "Upload failed",
      description: "Could not upload image. Try again.",
      variant: "destructive",
    });
    setSaving(false);
    return;
  }

  // ✅ Generate Public URL
  const { data } = supabase.storage
    .from("user_profile")
    .getPublicUrl(filePath);

  updates.profilePic = data.publicUrl;
}


      await updateDoc(userRef, updates);
      setUserData((prev) => prev ? { ...prev, ...updates } : updates as UserProfile);
      setPreviewUrl(null);
      setNewProfilePic(null);
      setIsEditing(false);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading profile...</div>;

  if (!userData)
    return <div className="flex items-center justify-center h-screen text-muted-foreground">Failed to load profile.</div>;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 flex-1">
        <Header />

        <main className="animate-slide-up pb-20 lg:pb-0">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
              {/* ✅ Left: Profile Info */}
              <div className="space-y-6">
                <Card className="p-6 shadow-soft relative">
                  <div className="flex flex-col items-center text-center mb-6 relative">
                    <div className="relative">
                      <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                        <AvatarImage src={previewUrl || userData.profilePic || ""} alt={userData.displayName} />
                        <AvatarFallback className="text-3xl">
                          {userData.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {isEditing && (
                        <>
                          <label
                            htmlFor="profile-upload"
                            className="absolute bottom-3 right-3 bg-primary text-white p-2 rounded-full cursor-pointer hover:scale-105 transition"
                          >
                            <Camera className="h-4 w-4" />
                          </label>
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files && handleImageSelect(e.target.files[0])}
                          />
                        </>
                      )}
                    </div>

                    <h1 className="text-2xl font-bold mb-1">{userData.displayName}</h1>
                    <p className="text-sm text-primary">@{userData.username}</p>
                  </div>

                  <Separator className="my-4" />

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Bio</Label>
                        <Textarea
                          value={userData.bio}
                          onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Department</Label>
                        <Input
                          value={userData.department}
                          onChange={(e) => setUserData({ ...userData, department: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Year</Label>
                        <Input
                          value={userData.year}
                          onChange={(e) => setUserData({ ...userData, year: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button onClick={handleSave} disabled={saving} className="flex-1">
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setIsEditing(false);
                            setPreviewUrl(null);
                            setNewProfilePic(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bio</h3>
                          <p className="text-sm leading-relaxed">{userData.bio || "No bio added yet."}</p>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm font-medium">{userData.department || "Not set"}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm font-medium">{userData.year || "Not set"}</p>
                        </div>
                      </div>

                      <Button className="w-full mt-6" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    </>
                  )}
                </Card>

                {/* ✅ Communities Section */}
                <Card className="p-6 shadow-soft">
                  <h3 className="font-bold text-sm mb-4 uppercase text-muted-foreground">My Communities</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Computer Science Dept.", icon: "💻" },
                      { name: "Chess Club", icon: "♟️" },
                      { name: "Hiking Group", icon: "🥾" },
                    ].map((club) => (
                      <div
                        key={club.name}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                          {club.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold truncate">{club.name}</h5>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* ✅ Right: Posts & Friends */}
              <div className="space-y-6">
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="w-full bg-card">
                    <TabsTrigger value="posts" className="flex-1">My Posts</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="space-y-4 mt-6">
                    {loadingPosts ? (
                      <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
                    ) : userPosts.length === 0 ? (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">
                          No posts yet. Share something with your campus community!
                        </p>
                      </Card>
                    ) : (
                      userPosts.map((post) => (
                        <Card
                          key={post.id}
                          className="overflow-hidden shadow-soft hover:shadow-medium transition"
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar>
                                <AvatarImage
                                src={userData.profilePic || post.authorAvatar}
                                alt={userData.displayName}
                                />
                                <AvatarFallback>{userData.displayName?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{userData.displayName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {post.createdAt
                                    ? formatDistanceToNow(
                                        post.createdAt.toDate
                                          ? post.createdAt.toDate()
                                          : new Date(post.createdAt)
                                      ) + " ago"
                                    : "Recently"}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm mb-3">{post.content}</p>
                            {post.imageUrl && (
                              <img
                                src={post.imageUrl}
                                alt="Post"
                                className="max-h-[400px] w-auto object-contain transition-transform duration-300 hover:scale-105"
                              />
                            )}
                          </div>
                          <Separator />
                          <div className="flex items-center justify-around p-2">
                            <Button variant="ghost" size="sm" className="gap-2 flex-1">
                              <Heart className="h-4 w-4" />
                              {post.likeCount || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 flex-1">
                              <MessageCircle className="h-4 w-4" />
                              {post.commentCount || 0}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 flex-1">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="friends" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {loadingUsers ? (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Loading...
                        </div>
                      ) : otherUsers.length === 0 ? (
                        <Card className="col-span-2 p-8 text-center">
                          <p className="text-muted-foreground">
                            No other users found yet. Check back later!
                          </p>
                        </Card>
                      ) : (
                        otherUsers.map((user, idx) => (
                          <Card
                            key={idx}
                            className="p-4 hover:shadow-medium transition cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage
                                  src={user.profilePic || user.photoURL || ""}
                                  alt={user.displayName}
                                />
                                <AvatarFallback>
                                  {user.displayName?.split(" ").map((n) => n[0]).join("") || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">
                                  {user.displayName}
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.department || "No department"}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
