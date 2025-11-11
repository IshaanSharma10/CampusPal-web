"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  ArrowLeft,
  Instagram,
  Users,
  MessageCircle,
  Image as ImageIcon,
  X,
  Star,
  Heart,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClubs, ClubPost } from "@/hooks/useClubs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Clubs() {
  const { clubs, joinedClubs, loading, joinClub, leaveClub, getClubPosts, postToClub, likePost, editPost, deletePost } = useClubs();
  const { currentUser } = useAuth();

  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [clubPosts, setClubPosts] = useState<ClubPost[]>([]);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [confirmLeaveClub, setConfirmLeaveClub] = useState<string | null>(null);
  const [aboutClub, setAboutClub] = useState<any>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Tech", "Academic", "Arts", "Social", "Sports", "Entrepreneurship", "Cultural"];

  // Load posts when club is selected
  useEffect(() => {
    if (selectedClubId) {
      setLoadingPosts(true);
      getClubPosts(selectedClubId).then((posts) => {
        setClubPosts(posts);
        setLoadingPosts(false);
      });
    }
  }, [selectedClubId]);

  const handleJoin = async (clubId: string, clubName: string) => {
    if (!currentUser) {
      toast.error("Please log in to join clubs");
      return;
    }
    await joinClub(clubId, clubName);
  };

  const handleLeave = async (clubId: string, clubName: string) => {
    await leaveClub(clubId, clubName);
    setConfirmLeaveClub(null);
    if (selectedClubId === clubId) {
      setSelectedClubId(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostToClub = async () => {
    if (!selectedClubId || !postContent.trim()) {
      toast.error("Please write a message");
      return;
    }
    await postToClub(selectedClubId, postContent, selectedImage || undefined);
    setPostContent("");
    setSelectedImage(null);
    setImagePreview("");
    // Refresh posts
    const posts = await getClubPosts(selectedClubId);
    setClubPosts(posts);
  };

  const selectedClub = clubs.find((c) => c.id === selectedClubId);
  const userJoinedClubs = clubs.filter((club) => joinedClubs.includes(club.id));
  
  const filteredClubs = clubs.filter((club) => {
    const matchSearch =
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "all" || club.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const topClubs = [...clubs].sort((a, b) => b.memberCount - a.memberCount).slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <MobileNav />
        <div className="lg:ml-64 flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
            <p className="text-muted-foreground">Loading clubs...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />
      <div className="lg:ml-64 flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
          {!selectedClubId ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold">Campus Communities</h1>
                <p className="text-muted-foreground">Join clubs, connect with students, and grow together</p>
              </div>

              {/* My Clubs Quick Access */}
              {userJoinedClubs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Your Clubs</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {userJoinedClubs.map((club) => (
                      <Card
                        key={club.id}
                        className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-primary/20 hover:border-primary"
                        onClick={() => setSelectedClubId(club.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-sm">{club.name}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Users className="h-3 w-3" />
                              {club.memberCount} members
                            </p>
                          </div>
                          <span className="text-lg">💬</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {club.description}
                        </p>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClubId(club.id);
                          }}
                        >
                          View Feed
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Search & Filter */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search clubs by name or topic..."
                    className="pl-10 bg-muted/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                    <TabsTrigger value="all" onClick={() => setSelectedCategory("all")}>
                      All
                    </TabsTrigger>
                    {categories.map((cat) => (
                      <TabsTrigger key={cat} value={cat} onClick={() => setSelectedCategory(cat)}>
                        {cat.slice(0, 3)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Top Clubs Section */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 text-blue-500" />
                  ⭐ Top Clubs
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {topClubs.map((club) => (
                    <Card
                      key={club.id}
                      className="p-4 border-2 border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-sm">{club.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Users className="h-3 w-3" />
                            {club.memberCount} members
                          </p>
                        </div>
                        <Star className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {club.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>

              {/* All Clubs Grid */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">
                  {searchTerm || selectedCategory !== "all"
                    ? `Search Results (${filteredClubs.length})`
                    : "All Clubs"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClubs.map((club) => (
                    <Card key={club.id} className="overflow-hidden hover:shadow-lg transition flex flex-col">
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg">{club.name}</h3>
                          {joinedClubs.includes(club.id) && (
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full">
                              Joined
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-1">
                          {club.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {club.memberCount} members
                          </div>
                          {club.category && (
                            <span className="bg-muted px-2 py-1 rounded text-xs">{club.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="border-t p-4 flex gap-2">
                        {joinedClubs.includes(club.id) ? (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedClubId(club.id)}
                            >
                              View Feed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmLeaveClub(club.id)}
                            >
                              Leave
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleJoin(club.id, club.name)}
                            >
                              Join
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setAboutClub(club)}>
                              About
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                {filteredClubs.length === 0 && (
                  <div className="flex items-center justify-center h-32 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No clubs found matching your search</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Club Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClubId(null)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClub?.name}</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-4 w-4" />
                      {selectedClub?.memberCount} members
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmLeaveClub(selectedClubId)}
                >
                  Leave Club
                </Button>
              </div>

              {/* Posts Feed */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {loadingPosts ? (
                  <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">Loading posts...</p>
                  </div>
                ) : clubPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground text-sm">No posts yet. Be the first to share!</p>
                  </div>
                ) : (
                   clubPosts.map((post) => (
                     <Card key={post.id} className="p-4 bg-background">
                       <div className="flex gap-3">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={post.userPhoto} />
                           <AvatarFallback>{post.userName.charAt(0).toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <div className="flex-1 w-full">
                           <div className="flex items-center justify-between mb-1">
                             <div>
                               <h4 className="font-semibold text-sm">{post.userName}</h4>
                               <span className="text-xs text-muted-foreground">
                                 {post.createdAt && new Date(post.createdAt).toLocaleDateString()}
                                 {post.updatedAt && post.updatedAt !== post.createdAt && " (edited)"}
                               </span>
                             </div>
                             {currentUser?.uid === post.userId && (
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="h-6 w-6">
                                     <MoreVertical className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem
                                     onClick={() => {
                                       setEditingPostId(post.id);
                                       setEditingContent(post.content);
                                     }}
                                   >
                                     <Edit2 className="h-4 w-4 mr-2" />
                                     Edit
                                   </DropdownMenuItem>
                                   <DropdownMenuItem
                                     className="text-red-600"
                                     onClick={async () => {
                                       await deletePost(post.id);
                                       const posts = await getClubPosts(selectedClubId!);
                                       setClubPosts(posts);
                                     }}
                                   >
                                     <Trash2 className="h-4 w-4 mr-2" />
                                     Delete
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             )}
                           </div>
                           {editingPostId === post.id ? (
                             <div className="space-y-2 mb-2">
                               <Textarea
                                 value={editingContent}
                                 onChange={(e) => setEditingContent(e.target.value)}
                                 className="resize-none text-sm"
                                 rows={3}
                               />
                               <div className="flex gap-2">
                                 <Button
                                   size="sm"
                                   onClick={async () => {
                                     await editPost(selectedClubId!, post.id, editingContent);
                                     const posts = await getClubPosts(selectedClubId!);
                                     setClubPosts(posts);
                                     setEditingPostId(null);
                                     setEditingContent("");
                                   }}
                                 >
                                   Save
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => {
                                     setEditingPostId(null);
                                     setEditingContent("");
                                   }}
                                 >
                                   Cancel
                                 </Button>
                               </div>
                             </div>
                           ) : (
                             <p className="text-sm text-foreground mb-2">{post.content}</p>
                           )}
                           {post.postImage && (
                             <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
                               <img
                                 src={post.postImage}
                                 alt="Post image"
                                 className="w-full h-auto object-cover"
                               />
                             </div>
                           )}
                           <div className="flex items-center gap-4 mt-3 pt-2 border-t">
                             <Button
                               variant="ghost"
                               size="sm"
                               className="gap-2"
                               onClick={async () => {
                                 await likePost(selectedClubId!, post.id);
                                 const posts = await getClubPosts(selectedClubId!);
                                 setClubPosts(posts);
                               }}
                             >
                               <Heart
                                 className={`h-4 w-4 ${
                                   post.likedBy?.includes(currentUser?.uid || "") 
                                     ? "fill-red-500 text-red-500" 
                                     : ""
                                 }`}
                               />
                               <span className="text-xs">{post.likes || 0}</span>
                             </Button>
                           </div>
                         </div>
                       </div>
                     </Card>
                   ))
                 )}
              </div>

              {/* Post Input */}
              <div className="border-t pt-4 space-y-3 bg-muted/30 p-4 rounded-lg">
                <div className="space-y-2">
                  <Textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Share something with the club..."
                    className="resize-none"
                    rows={3}
                  />
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Add Photo
                  </Button>
                  <Button
                    onClick={handlePostToClub}
                    disabled={!postContent.trim()}
                    className="flex-1"
                  >
                    Share Post
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* About Club Modal */}
      <Dialog open={!!aboutClub} onOpenChange={() => setAboutClub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{aboutClub?.name}</DialogTitle>
            <DialogDescription>{aboutClub?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{aboutClub?.memberCount} Members</span>
            </div>
            {aboutClub?.category && (
              <div className="text-sm">
                <span className="font-semibold">Category:</span> {aboutClub.category}
              </div>
            )}
            <div className="flex items-center space-x-3">
              {aboutClub?.instagram && (
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
              )}
              {aboutClub?.website && (
                <Button variant="outline" size="sm">
                  Website
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAboutClub(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Modal */}
      <Dialog open={!!confirmLeaveClub} onOpenChange={() => setConfirmLeaveClub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {clubs.find((c) => c.id === confirmLeaveClub)?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                const clubName =
                  clubs.find((c) => c.id === confirmLeaveClub)?.name || "Club";
                handleLeave(confirmLeaveClub!, clubName);
              }}
            >
              Yes, Leave
            </Button>
            <Button variant="outline" onClick={() => setConfirmLeaveClub(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
