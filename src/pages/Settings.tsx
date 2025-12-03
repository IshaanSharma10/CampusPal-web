import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LogOut, 
  Upload, 
  Bell, 
  Trash2, 
  AlertCircle,
  MessageSquare as MessageSquareIcon,
  ThumbsUp,
  Users
} from "lucide-react";
import { 
  signOut, 
  updateProfile, 
  deleteUser,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth, db } from "@/FirebaseConfig";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../SupabaseConfig";
import { getCurrentUserProfilePic, getAvatarFallback } from "@/lib/profilePicUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState({
    displayName: "",
    major: "",
    email: "",
    photoURL: "",
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  const [reauthDialog, setReauthDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    friendRequests: true,
    likes: true,
    comments: true,
    messages: true,
  });

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData({
            displayName: data.displayName || currentUser.displayName || "",
            major: data.major || "",
            email: currentUser.email || "",
            photoURL: data.profilePic || data.photoURL || currentUser.photoURL || "",
          });
        } else {
          setUserData({
            displayName: currentUser.displayName || "",
            major: "",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Error loading profile",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Load notification settings
    const loadNotificationSettings = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.notificationSettings) {
            setNotificationSettings(data.notificationSettings);
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      }
    };

    loadNotificationSettings();
  }, [navigate, toast]);

  // ✅ Save notification settings
  const handleSaveNotificationSettings = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await setDoc(
        userRef,
        { notificationSettings },
        { merge: true }
      );
      toast({
        title: "Notification settings updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error updating settings",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // ✅ Re-authenticate user
  const handleReauthenticate = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);
      
      setReauthDialog(false);
      toast({
        title: "Re-authentication successful",
        description: "You can now delete your account.",
      });
      
      // Show delete dialog again
      setDeleteAccountDialog(true);
    } catch (error: any) {
      console.error("Re-authentication error:", error);
      toast({
        title: "Re-authentication failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  // ✅ Delete account handler
  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", currentUser.uid));

      // Delete Firebase auth user
      await deleteUser(currentUser);

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      setDeleteAccountDialog(false);
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      
      // Check if it's a re-authentication error
      if (error.code === "auth/requires-recent-login") {
        setDeleteAccountDialog(false);
        setReauthDialog(true);
        toast({
          title: "Re-authentication required",
          description: "Please sign in again to delete your account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error deleting account",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  // ✅ Logout handler
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // ✅ Save Profile Info (non-image fields)
  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser!.uid);
      await setDoc(
        userRef,
        {
          displayName: userData.displayName,
          major: userData.major,
          email: userData.email,
          profilePic: userData.photoURL,
        },
        { merge: true }
      );

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: userData.displayName,
          photoURL: userData.photoURL,
        });
      }

      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
    } catch (error) {
      console.error("Error saving user data:", error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // ✅ Upload Photo to Supabase
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const currentUser = auth.currentUser;
    if (!file || !currentUser) return;

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUser.uid}_${Date.now()}.${fileExt}`;
      const filePath = `profile-pics/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("USER_PROFILE") // ✅ Change to "user_profile" if lowercase bucket
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError.message);
        toast({
          title: "Upload failed",
          description: "Could not upload image. Try again.",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("USER_PROFILE")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Update Auth + Firestore
      await updateProfile(currentUser, { photoURL: publicUrl });
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, { profilePic: publicUrl }, { merge: true });

      setUserData((prev) => ({ ...prev, photoURL: publicUrl }));
      setPreviewUrl(null);

      toast({
        title: "Profile photo updated!",
        description: "Your new photo has been saved successfully.",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error uploading photo",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 flex-1 w-full">
        <Header />

        <main className="w-full p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6 max-w-5xl mx-auto animate-slide-up">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="account">Account</TabsTrigger>
              {/* <TabsTrigger value="privacy">Privacy</TabsTrigger> */}
              {/* <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger> */}
              <TabsTrigger value="danger" className="text-destructive">
                Danger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-6">Profile Information</h3>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={previewUrl || userData.photoURL || ""}
                        alt={userData.displayName}
                      />
                      <AvatarFallback className="text-lg">
                        {getAvatarFallback(userData.displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <label
                      htmlFor="fileUpload"
                      className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition"
                    >
                      <Upload className="h-4 w-4" />
                      <input
                        id="fileUpload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-semibold">{userData.displayName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {userData.major || "Not specified"}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Change Photo"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={userData.displayName}
                      onChange={(e) =>
                        setUserData({ ...userData, displayName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={userData.major}
                      onChange={(e) =>
                        setUserData({ ...userData, major: e.target.value })
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-6">Account Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userData.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value="********" disabled />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  className="gap-2 text-destructive hover:text-destructive w-full sm:w-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Cancel
                  </Button>
                  <Button className="flex-1 sm:flex-none" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6 shadow-soft">
               <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-blue-50 rounded-lg">
                       <Users className="h-5 w-5 text-blue-600" />
                     </div>
                     <div>
                       <p className="font-medium">Friend Requests</p>
                       <p className="text-sm text-muted-foreground">Get notified when someone sends you a friend request</p>
                     </div>
                   </div>
                   <Switch
                     checked={notificationSettings.friendRequests}
                     onCheckedChange={(checked) =>
                       setNotificationSettings({
                         ...notificationSettings,
                         friendRequests: checked,
                       })
                     }
                   />
                 </div>

                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-pink-50 rounded-lg">
                       <ThumbsUp className="h-5 w-5 text-pink-600" />
                     </div>
                     <div>
                       <p className="font-medium">Likes</p>
                       <p className="text-sm text-muted-foreground">Get notified when someone likes your posts</p>
                     </div>
                   </div>
                   <Switch
                     checked={notificationSettings.likes}
                     onCheckedChange={(checked) =>
                       setNotificationSettings({
                         ...notificationSettings,
                         likes: checked,
                       })
                     }
                   />
                 </div>

                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-green-50 rounded-lg">
                       <MessageSquareIcon className="h-5 w-5 text-green-600" />
                     </div>
                     <div>
                       <p className="font-medium">Comments</p>
                       <p className="text-sm text-muted-foreground">Get notified when someone comments on your posts</p>
                     </div>
                   </div>
                   <Switch
                     checked={notificationSettings.comments}
                     onCheckedChange={(checked) =>
                       setNotificationSettings({
                         ...notificationSettings,
                         comments: checked,
                       })
                     }
                   />
                 </div>

                 <div className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-50 rounded-lg">
                       <Bell className="h-5 w-5 text-purple-600" />
                     </div>
                     <div>
                       <p className="font-medium">Messages</p>
                       <p className="text-sm text-muted-foreground">Get notified when someone sends you a message</p>
                     </div>
                   </div>
                   <Switch
                     checked={notificationSettings.messages}
                     onCheckedChange={(checked) =>
                       setNotificationSettings({
                         ...notificationSettings,
                         messages: checked,
                       })
                     }
                   />
                 </div>
               </div>

               <div className="flex gap-3 mt-6">
                 <Button variant="outline" className="flex-1">
                   Cancel
                 </Button>
                 <Button className="flex-1" onClick={handleSaveNotificationSettings}>
                   Save Preferences
                 </Button>
               </div>
              </Card>

              <Card className="p-6 shadow-soft border-blue-200 bg-blue-50/50">
               <div className="flex gap-3">
                 <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                 <div>
                   <p className="font-medium text-blue-900">Manage all notifications</p>
                   <p className="text-sm text-blue-700 mt-1">
                     You can also manage your notifications in detail by visiting the Notifications page.
                   </p>
                 </div>
               </div>
              </Card>
              </TabsContent>

              <TabsContent value="danger" className="space-y-6">
              {/* <Card className="p-6 shadow-soft border-red-200 bg-red-50/50">
               <div className="flex gap-3 mb-6">
                 <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                 <div>
                   <h3 className="font-bold text-red-900">Danger Zone</h3>
                   <p className="text-sm text-red-700 mt-1">
                     These actions cannot be undone. Please proceed with caution.
                   </p>
                 </div>
               </div>
              </Card> */}

              <Card className="p-6 shadow-soft border-red-200">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div>
                   <h3 className="text-lg font-bold text-red-600">Delete Account</h3>
                   <p className="text-sm text-muted-foreground mt-2">
                     Permanently delete your CampusPal account and all associated data. This action cannot be reversed.
                   </p>
                 </div>
                 <Button
                   variant="destructive"
                   className="gap-2 whitespace-nowrap w-full sm:w-auto"
                   onClick={() => setDeleteAccountDialog(true)}
                   disabled={deletingAccount}
                 >
                   <Trash2 className="h-4 w-4" />
                   {deletingAccount ? "Deleting..." : "Delete Account"}
                 </Button>
               </div>
              </Card>
              </TabsContent>
              </Tabs>
              </main>
              </div>

              {/* Delete Account Confirmation Dialog */}
              <AlertDialog open={deleteAccountDialog} onOpenChange={setDeleteAccountDialog}>
              <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 mt-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-red-900 mb-2">Are you absolutely sure?</p>
                <p className="text-sm text-red-800">
                  This will permanently delete your account and all associated data including:
                </p>
                <ul className="list-disc list-inside text-sm text-red-800 mt-2 ml-2">
                  <li>Your profile and all personal information</li>
                  <li>Your posts and interactions</li>
                  <li>Your messages and chats</li>
                  <li>All other account data</li>
                </ul>
                <p className="text-sm text-red-800 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-3 justify-end">
              <AlertDialogCancel disabled={deletingAccount}>Cancel</AlertDialogCancel>
              <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingAccount}
              >
              {deletingAccount ? "Deleting..." : "Delete My Account"}
              </AlertDialogAction>
              </div>
              </AlertDialogContent>
              </AlertDialog>

              {/* Re-authentication Dialog */}
              <AlertDialog open={reauthDialog} onOpenChange={setReauthDialog}>
              <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle className="text-blue-600">Re-authentication Required</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">Sign in again to continue</p>
                <p className="text-sm text-blue-800">
                  For security reasons, we need you to sign in with your Google account again before deleting your account.
                </p>
              </div>
              </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
              onClick={handleReauthenticate}
              className="bg-blue-600 hover:bg-blue-700"
              >
              Sign In With Google
              </AlertDialogAction>
              </div>
              </AlertDialogContent>
              </AlertDialog>
              </div>
              );
              }
