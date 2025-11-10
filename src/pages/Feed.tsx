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
    X,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Send,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    createPost,
    getPosts,
    likePost,
    unlikePost,
    updatePost,
    deletePost,
    Post,
    addComment,
    getComments,
    updateComment,
    deleteComment,
    Comment,
} from "@/lib/firebase-utils";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/SupabaseConfig";
import imageCompression from "browser-image-compression";
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
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

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
        return file;
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
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deletePostId, setDeletePostId] = useState<string | null>(null);
    const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState("");

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

    // ✅ Share Post
    function handleShare(post: Post) {
        const postUrl = `${window.location.origin}/post/${post.id}`;
        const text = post.content
            ? `Check out this post on CampusPal: "${post.content.substring(0, 100)}"${post.content.length > 100 ? "..." : ""
            }`
            : "Check out this post on CampusPal!";

        const shareData = {
            title: "CampusPal Post",
            text,
            url: postUrl,
        };

        if (navigator.share) {
            navigator
                .share(shareData)
                .then(() => toast.success("Shared successfully!"))
                .catch((err) => {
                    if (err.name !== "AbortError") {
                        toast.error("Failed to share post");
                        console.error("Share error:", err);
                    }
                });
        } else {
            navigator.clipboard.writeText(`${text} ${postUrl}`);
            toast.success("Link copied to clipboard!");
        }
    }

    // ✅ Open Comments Sheet
    async function openComments(post: Post) {
        if (!post.id) return;
        setCommentsPostId(post.id);
        setLoadingComments(true);
        try {
            const fetchedComments = await getComments(post.id);
            setComments(fetchedComments);
        } catch (error: any) {
            toast.error("Error loading comments");
            console.error(error);
        } finally {
            setLoadingComments(false);
        }
    }

    // ✅ Add Comment
    async function handleAddComment() {
        if (!newComment.trim() || !commentsPostId) {
            toast.error("Please write a comment!");
            return;
        }

        try {
            await addComment({
                postId: commentsPostId,
                authorId: currentUser.uid,
                authorName: userProfile?.displayName || currentUser.displayName || "Anonymous",
                authorAvatar: userProfile?.photoURL || currentUser.photoURL,
                content: newComment,
            });

            setNewComment("");
            toast.success("Comment posted!");

            // Reload comments
            const fetchedComments = await getComments(commentsPostId);
            setComments(fetchedComments);
        } catch (error: any) {
            toast.error(`Failed to post comment: ${error.message}`);
        }
    }

    // ✅ Edit Comment
    async function handleEditComment(comment: Comment) {
        setEditingCommentId(comment.id || null);
        setEditingCommentText(comment.content);
    }

    // ✅ Save Edited Comment
    async function saveEditedComment() {
        if (!editingCommentId || !editingCommentText.trim()) {
            toast.error("Comment cannot be empty!");
            return;
        }

        try {
            await updateComment(editingCommentId, { content: editingCommentText });
            setEditingCommentId(null);
            setEditingCommentText("");
            toast.success("Comment updated!");

            // Reload comments
            if (commentsPostId) {
                const fetchedComments = await getComments(commentsPostId);
                setComments(fetchedComments);
            }
        } catch (error: any) {
            toast.error(`Failed to update comment: ${error.message}`);
        }
    }

    // ✅ Cancel Edit Comment
    function cancelEditComment() {
        setEditingCommentId(null);
        setEditingCommentText("");
    }

    // ✅ Delete Comment
    async function handleDeleteComment(commentId: string) {
        try {
            await deleteComment(commentId);
            toast.success("Comment deleted!");

            // Reload comments
            if (commentsPostId) {
                const fetchedComments = await getComments(commentsPostId);
                setComments(fetchedComments);
            }
        } catch (error: any) {
            toast.error(`Failed to delete comment: ${error.message}`);
        }
    }

    // ✅ Edit Post
    async function handleEditPost(post: Post) {
        setEditingPostId(post.id || null);
        setEditingContent(post.content);
    }

    async function saveEditedPost() {
        if (!editingPostId || !editingContent.trim()) {
            toast.error("Post content cannot be empty!");
            return;
        }

        try {
            await updatePost(editingPostId, { content: editingContent });
            setEditingPostId(null);
            setEditingContent("");
            toast.success("Post updated!");
            loadPosts();
        } catch (error: any) {
            toast.error(`Failed to update post: ${error.message}`);
        }
    }

    function cancelEdit() {
        setEditingPostId(null);
        setEditingContent("");
    }

    // ✅ Delete Post
    async function handleDeletePost() {
        if (!deletePostId) return;

        try {
            await deletePost(deletePostId);
            setDeletePostId(null);
            toast.success("Post deleted!");
            loadPosts();
        } catch (error: any) {
            toast.error(`Failed to delete post: ${error.message}`);
        }
    }

    // ✅ Toggle Hide Likes
    async function handleToggleHideLikes(post: Post) {
        if (!post.id) return;

        try {
            await updatePost(post.id, { hideLikes: !post.hideLikes });
            toast.success(post.hideLikes ? "Likes are now visible" : "Likes are now hidden");
            loadPosts();
        } catch (error: any) {
            toast.error(`Failed to update post: ${error.message}`);
        }
    }

    // ✅ Render
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
                                    placeholder={`What's on your mind, ${userProfile?.displayName || currentUser.displayName || "User"
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
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
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

                                        {/* Post Options Menu (Edit, Delete, Hide Likes) */}
                                        {currentUser.uid === post.authorId && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditPost(post)}>
                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                        Edit Post
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleToggleHideLikes(post)}>
                                                        {post.hideLikes ? (
                                                            <>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Show Likes
                                                            </>
                                                        ) : (
                                                            <>
                                                                <EyeOff className="h-4 w-4 mr-2" />
                                                                Hide Likes
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletePostId(post.id || null)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete Post
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {/* Edit Mode */}
                                    {editingPostId === post.id ? (
                                        <div className="mt-3">
                                            <Textarea
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                className="min-h-[80px] resize-none"
                                                placeholder="Edit your post..."
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={saveEditedPost}
                                                    className="bg-primary hover:bg-primary/90"
                                                >
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
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
                                        </>
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

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="gap-2 flex-1">
                                                <Share2 className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleShare(post)}>
                                                Share via System
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    window.open(
                                                        `https://wa.me/?text=${encodeURIComponent(
                                                            `Check out this post on CampusPal:\n${post.content}\n${window.location.origin}/post/${post.id}`
                                                        )}`,
                                                        "_blank"
                                                    )
                                                }
                                            >
                                                WhatsApp
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    window.open(
                                                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                                            `Check out this post on CampusPal! ${window.location.origin}/post/${post.id}`
                                                        )}`,
                                                        "_blank"
                                                    )
                                                }
                                            >
                                                Twitter / X
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                                                    toast.success("Link copied to clipboard!");
                                                }}
                                            >
                                                Copy Link
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))
                    )}

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this post? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeletePost}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </AlertDialogAction>
                            </div>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Comments Sheet */}
                    <Sheet open={!!commentsPostId} onOpenChange={(open) => !open && setCommentsPostId(null)}>
                        <SheetContent className="w-full sm:w-[400px] flex flex-col">
                            <SheetHeader>
                                <SheetTitle>Comments</SheetTitle>
                            </SheetHeader>

                            {/* Comments List */}
                            <div className="flex-1 overflow-y-auto space-y-4 py-4">
                                {loadingComments ? (
                                    <div className="text-center text-muted-foreground">Loading comments...</div>
                                ) : comments.length === 0 ? (
                                    <div className="text-center text-muted-foreground text-sm">
                                        No comments yet. Be the first to comment!
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="border-b pb-3">
                                            {editingCommentId === comment.id ? (
                                                <div>
                                                    <Textarea
                                                        value={editingCommentText}
                                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                                        className="min-h-[60px] resize-none text-sm"
                                                        placeholder="Edit comment..."
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={saveEditedComment}
                                                            className="bg-primary hover:bg-primary/90"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={cancelEditComment}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-start gap-2 flex-1">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={comment.authorAvatar} />
                                                                <AvatarFallback className="text-xs">
                                                                    {comment.authorName?.charAt(0) || "U"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <p className="font-semibold text-sm">{comment.authorName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {comment.createdAt &&
                                                                        formatDistanceToNow(comment.createdAt.toDate(), {
                                                                            addSuffix: true,
                                                                        })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Comment Options Menu */}
                                                        {currentUser.uid === comment.authorId && (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                                        <MoreVertical className="h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                                                                        <Edit2 className="h-3 w-3 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteComment(comment.id || "")}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                    </div>
                                                    <p className="text-sm mt-2 ml-10">{comment.content}</p>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Comment Input */}
                            <Separator className="my-2" />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                    className="text-sm"
                                />
                                <Button
                                    size="icon"
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim()}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </main>
            </div>
        </div>
    );
}
