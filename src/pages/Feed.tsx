import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Send,
  X,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  createPost,
  getPosts,
  likePost,
  unlikePost,
  Post,
  addComment,
  getComments,
  Comment,
  deletePost,
  updatePost,
  updateComment,
  deleteComment,
} from "@/lib/firebase-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/SupabaseConfig";
import imageCompression from "browser-image-compression";

// ✅ Compress and resize image before upload
async function compressImage(file: File): Promise<File> {
  const options = {
    maxWidthOrHeight: 1080,
    maxSizeMB: 0.8,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(
      `💾 Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
    );
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // fallback if compression fails
  }
}

// ✅ Upload compressed image to Supabase
async function uploadImageToSupabase(file: File, folder: string): Promise<string> {
  const safeFileName = file.name.replace(/[^\w.-]/g, "_");
  const filePath = `${folder}/${Date.now()}_${safeFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("study-materials")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("study-materials").getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error("Failed to get public URL");

  return data.publicUrl;
}

// ✅ Categories
const categories = [
  { value: "all", label: "All Posts" },
  { value: "academic", label: "Academic" },
  { value: "events", label: "Events" },
  { value: "clubs", label: "Clubs" },
  { value: "lost-found", label: "Lost & Found" },
  { value: "marketplace", label: "Marketplace" },
  { value: "fun", label: "Fun" },
];

export default function Feed() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Post["category"]>("fun");
  const [filterCategory, setFilterCategory] = useState("all");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  // ✅ Load posts
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadPosts();
  }, [currentUser, filterCategory]);

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const fetchedPosts = await getPosts(filterCategory === "all" ? undefined : filterCategory);
      setPosts(fetchedPosts);
    } catch {
      toast.error("Error loading posts");
    } finally {
      setLoadingPosts(false);
    }
  }

  // ✅ Create new post
  async function handleCreatePost() {
    if (!newPost.trim() && !imageFile) {
      toast.error("Please add some text or an image!");
      return;
    }
    if (!currentUser) {
      toast.error("You must be logged in to post!");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        imageUrl = await uploadImageToSupabase(compressed, "posts");
      }

      const authorName =
        userProfile?.displayName || currentUser.displayName || "Anonymous";
      const authorAvatar =
        userProfile?.photoURL || currentUser.photoURL || "";

      await createPost({
        authorId: currentUser.uid,
        authorName,
        authorAvatar,
        content: newPost,
        imageUrl,
        category: selectedCategory,
      });

      setNewPost("");
      setImageFile(null);
      setImagePreview("");
      setSelectedCategory("fun");
      toast.success("Post created!");
      loadPosts();
    } catch (error: any) {
      toast.error(`Failed to create post: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Handle Image Select
  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressedFile = await compressImage(file);
    setImageFile(compressedFile);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(compressedFile);
  }

  // ✅ Like / Unlike Post
  async function handleLike(post: Post) {
    if (!currentUser || !post.id) return;
    const isLiked = post.likes?.includes(currentUser.uid);
    try {
      if (isLiked) await unlikePost(post.id, currentUser.uid);
      else
        await likePost(
          post.id,
          currentUser.uid,
          currentUser.displayName || "Anonymous",
          currentUser.photoURL || undefined
        );
      loadPosts();
    } catch (error: any) {
      console.error("Error updating like:", error);
      toast.error("Error updating like");
    }
  }

  // ✅ Comments
  async function openComments(post: Post) {
    setSelectedPost(post);
    if (post.id) {
      try {
        const fetchedComments = await getComments(post.id);
        setComments(fetchedComments);
      } catch {
        toast.error("Error loading comments");
      }
    }
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedPost?.id || !currentUser) return;
    const authorName = userProfile?.displayName || currentUser.displayName || "Anonymous";
    const authorAvatar = userProfile?.photoURL || currentUser.photoURL || "";
    try {
      await addComment({
        postId: selectedPost.id,
        authorId: currentUser.uid,
        authorName,
        authorAvatar,
        content: newComment,
      });
      setNewComment("");
      const fetchedComments = await getComments(selectedPost.id);
      setComments(fetchedComments);
      loadPosts();
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    }
  }

  // ✅ UI Render
  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />
      <div className="lg:ml-64 flex-1">
        <Header />
        <main className="mx-auto max-w-4xl p-4 sm:p-6 pb-20 lg:pb-6">
          {/* Filter */}
          <div className="mb-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Post */}
          <Card className="p-4 shadow-soft hover:shadow-medium transition-smooth mb-6">
            <div className="flex gap-3">
              <Avatar>
                <AvatarImage src={userProfile?.photoURL || currentUser.photoURL} />
                <AvatarFallback>
                  {userProfile?.displayName?.charAt(0) ||
                    currentUser.displayName?.charAt(0) ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder={`What's on your mind, ${
                    userProfile?.displayName || currentUser.displayName || "User"
                  }?`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[80px] resize-none border-0 bg-muted/50 focus-visible:ring-1"
                />
                {imagePreview && (
                  <div className="relative mt-2">
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded" />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={handleImageSelect}
                    />
                    <label htmlFor="image-upload">
                      <Button variant="ghost" size="sm" className="gap-2" asChild>
                        <span>
                          <ImageIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Photo</span>
                        </span>
                      </Button>
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(val) => setSelectedCategory(val as Post["category"])}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((c) => c.value !== "all")
                          .map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleCreatePost}
                    disabled={loading || (!newPost.trim() && !imageFile)}
                  >
                    {loading ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Posts List */}
          {loadingPosts ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="overflow-hidden shadow-soft mb-4">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={post.authorAvatar} />
                      <AvatarFallback>{post.authorName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{post.authorName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {post.createdAt &&
                          formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mt-3 -mx-4 overflow-hidden rounded-b-md bg-black/5 flex items-center justify-center">
  <img
    src={post.imageUrl}
    alt="Post content"
    className="max-h-[400px] w-auto object-contain transition-transform duration-300 hover:scale-105"
  />
</div>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-around p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 flex-1 ${post.likes?.includes(currentUser.uid) ? "text-red-500" : ""}`}
                    onClick={() => handleLike(post)}
                  >
                    <Heart
                      className={`h-4 w-4 ${post.likes?.includes(currentUser.uid) ? "fill-red-500" : ""}`}
                    />
                    {!post.hideLikes && <span className="text-xs">{post.likeCount || 0}</span>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 flex-1"
                    onClick={() => openComments(post)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs">{post.commentCount || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 flex-1"
                    onClick={() => toast.info("Share feature coming soon!")}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
