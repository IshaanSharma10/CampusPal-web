import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { LostFound, addComment, getComments, deleteComment, Comment, createDirectChat, sendMessage } from "@/lib/firebase-utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/SupabaseConfig";
import { Image as ImageIcon, MapPin, Calendar, Phone, Check, X, MessageCircle, Send, MoreVertical, Trash2, MessageSquare, Plus, ImagePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const itemCategories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'books', label: 'Books' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'documents', label: 'Documents' },
    { value: 'other', label: 'Other' },
];

// ✅ Supabase upload utility
async function uploadImageToSupabase(file: File, folder: string): Promise<string> {
    const safeFileName = file.name.replace(/[^\w.-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
        .from("lost_items") // ⚡ your public bucket
        .upload(filePath, file);

    if (uploadError) {
        console.error("❌ Storage upload error:", {
            message: uploadError.message,
            name: uploadError.name
        });
        throw uploadError;
    }

    const { data } = supabase.storage
        .from("lost_items")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Failed to get public URL");

    return data.publicUrl;
}

export default function LostFoundPage() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [items, setItems] = useState<LostFound[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingItems, setLoadingItems] = useState(true);
    const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
    const [selectedItem, setSelectedItem] = useState<LostFound | null>(null);
    const [itemComments, setItemComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedItemForContact, setSelectedItemForContact] = useState<LostFound | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [itemType, setItemType] = useState<'lost' | 'found'>('lost');

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        location: "",
        date: "",
        contact: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        loadItems();
    }, [currentUser, navigate]);

    const loadItems = async () => {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from("lost_found")
                .select("*")
                .eq("resolved", false)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("❌ Supabase error details:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            // Map Supabase data to LostFound interface
            const mappedItems: LostFound[] = (data || []).map((item: any) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                category: item.category,
                location: item.location,
                date: item.date ? { toDate: () => new Date(item.date) } : null,
                type: item.type,
                reporterId: item.reporter_id,
                reporterName: item.reporter_name,
                reporterContact: item.reporter_contact,
                imageUrl: item.image_url,
                resolved: item.resolved,
                createdAt: item.created_at ? { toDate: () => new Date(item.created_at) } : null,
            }));

            setItems(mappedItems);
            console.log("✅ Loaded lost and found items:", mappedItems?.length || 0);
        } catch (error: any) {
            console.error("❌ Error loading items:", error);
            const errorMessage = error?.message || error?.details || "Failed to fetch lost and found items";
            
            // Check if it's a table not found error
            if (error?.code === "PGRST116" || error?.message?.includes("does not exist") || error?.message?.includes("404")) {
                toast({
                    title: "Table not found",
                    description: "The 'lost_found' table doesn't exist in Supabase. Please create it first.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error loading items",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
            setItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title || !formData.description || !formData.category || !formData.location || !formData.date || !formData.contact) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            let imageUrl: string | undefined = undefined;
            if (imageFile) {
                imageUrl = await uploadImageToSupabase(imageFile, 'lostfound');
            }

            const { data, error } = await supabase
                .from("lost_found")
                .insert([
                    {
                        title: formData.title,
                        description: formData.description,
                        category: formData.category,
                        location: formData.location,
                        date: formData.date,
                        type: itemType,
                        reporter_id: currentUser!.uid,
                        reporter_name: userProfile?.displayName || 'Anonymous',
                        reporter_contact: formData.contact,
                        image_url: imageUrl,
                        resolved: false,
                    },
                ])
                .select()
                .single();

            if (error) {
                console.error("❌ Supabase insert error:", {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log("✅ Item created:", data.id);
            toast({
                title: "Item reported successfully",
                description: `Your ${itemType} item has been posted`,
            });

            setFormData({
                title: "",
                description: "",
                category: "",
                location: "",
                date: "",
                contact: "",
            });
            setImageFile(null);
            setImagePreview("");
            setIsDialogOpen(false);
            loadItems();
        } catch (error) {
            console.error("❌ Error creating item:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to report item",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkResolved = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from("lost_found")
                .update({ resolved: true })
                .eq("id", itemId);

            if (error) throw error;

            toast({
                title: "Item marked as resolved",
            });
            loadItems();
        } catch (error) {
            console.error("Error marking item as resolved:", error);
            toast({
                title: "Error",
                description: "Failed to mark item as resolved",
                variant: "destructive",
            });
        }
    };

    const openItemComments = async (item: LostFound) => {
        setSelectedItem(item);
        if (item.id) {
            setLoadingComments(true);
            try {
                const comments = await getComments(item.id);
                setItemComments(comments);
            } catch (error) {
                console.error("Error loading comments:", error);
                toast({
                    title: "Error loading comments",
                    variant: "destructive",
                });
            } finally {
                setLoadingComments(false);
            }
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedItem?.id || !currentUser) return;

        try {
            await addComment({
                postId: selectedItem.id,
                authorId: currentUser.uid,
                authorName: userProfile?.displayName || currentUser.displayName || "Anonymous",
                authorAvatar: userProfile?.photoURL || currentUser.photoURL,
                content: newComment,
            });

            setNewComment("");
            const comments = await getComments(selectedItem.id);
            setItemComments(comments);
            toast({
                title: "Comment added successfully!",
            });
        } catch (error) {
            console.error("Error adding comment:", error);
            toast({
                title: "Error adding comment",
                variant: "destructive",
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            toast({
                title: "Comment deleted!",
            });
            if (selectedItem?.id) {
                const comments = await getComments(selectedItem.id);
                setItemComments(comments);
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({
                title: "Error deleting comment",
                variant: "destructive",
            });
        }
    };

    const filteredItems = items.filter(item => item.type === activeTab && !item.resolved);

    // 🔹 Contact reporter - show options dialog
    function handleContactClick(item: LostFound) {
        setSelectedItemForContact(item);
        setContactDialogOpen(true);
    }

    // 🔹 Call reporter
    function handleCallNow(contact: string) {
        window.location.href = `tel:${contact}`;
        setContactDialogOpen(false);
    }

    // 🔹 Chat with reporter
    async function handleChatWithReporter(item: LostFound) {
        if (!currentUser) {
            toast({ title: "Please log in to chat", variant: "destructive" });
            return;
        }

        try {
            const chatId = await createDirectChat(currentUser.uid, item.reporterId);

            // Send default message about the item
            const itemType = item.type === 'lost' ? 'lost' : 'found';
            const defaultMessage = `Hi ${item.reporterName}, I'm reaching out regarding your ${itemType} item: "${item.title}". Can you provide more details?`;

            await sendMessage({
                chatId: chatId,
                senderId: currentUser.uid,
                senderName: userProfile?.displayName || currentUser.displayName || "Anonymous",
                senderAvatar: userProfile?.photoURL || currentUser.photoURL,
                content: defaultMessage,
                type: "text",
            });

            // Navigate to chat page
            navigate("/chat");
            setContactDialogOpen(false);
            toast({ title: "Chat started!", description: `Now chatting with ${item.reporterName}` });
        } catch (error: any) {
            console.error("Error starting chat:", error);
            toast({
                title: "Error starting chat",
                description: error.message || "Please try again",
                variant: "destructive",
            });
        }
    }

    if (!currentUser) return null;

    return (
        <div className="flex min-h-screen w-full bg-background">
            <Sidebar />
            <MobileNav />

            <div className="lg:ml-64 flex-1 w-full">
                <Header />

                <main className="w-full p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Lost & Found</h1>
                                <p className="text-muted-foreground">Report and find lost items on campus</p>
                            </div>

                            {/* Dialog for new listing */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" /> Report Item
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Report Lost or Found Item</DialogTitle>
                                        <DialogDescription>Add details about the item you lost or found.</DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label>Item Type *</Label>
                                            <Select value={itemType} onValueChange={(v) => setItemType(v as 'lost' | 'found')}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="lost">Lost Item</SelectItem>
                                                    <SelectItem value="found">Found Item</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Title *</Label>
                                            <Input
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., Black Wallet"
                                            />
                                        </div>

                                        <div>
                                            <Label>Description *</Label>
                                            <Textarea
                                                required
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Describe the item in detail..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Category *</Label>
                                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {itemCategories.map(cat => (
                                                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Location *</Label>
                                                <Input
                                                    required
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    placeholder="e.g., Library"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Date {itemType === 'lost' ? 'Lost' : 'Found'} *</Label>
                                                <Input
                                                    required
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <Label>Contact *</Label>
                                                <Input
                                                    required
                                                    value={formData.contact}
                                                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                    placeholder="Phone or Email"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Image (Optional)</Label>
                                            <div className="mt-2">
                                                {imagePreview ? (
                                                    <div className="relative">
                                                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            className="absolute top-2 right-2"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setImagePreview("");
                                                            }}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent">
                                                        <ImagePlus className="h-8 w-8 mb-2 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            Click to upload image
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={handleImageSelect}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? "Reporting..." : `Report ${itemType === 'lost' ? 'Lost' : 'Found'} Item`}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Tabs */}
                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as 'lost' | 'found')}
                            className="w-full"
                        >
                            <TabsList>
                                <TabsTrigger value="lost">Lost Items</TabsTrigger>
                                <TabsTrigger value="found">Found Items</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Items Grid */}
                        {loadingItems ? (
                            <div className="text-center py-12 text-muted-foreground">Loading items...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                No {activeTab} items reported yet
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredItems.map((item) => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <div className="aspect-square bg-muted overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={item.type === 'lost' ? 'destructive' : 'default'} className={item.type === 'found' ? 'bg-green-500' : ''}>
                                                    {item.type === 'lost' ? 'Lost' : 'Found'}
                                                </Badge>
                                                <Badge variant="outline">{item.category}</Badge>
                                            </div>
                                            <h3 className="font-bold text-lg">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {item.description}
                                            </p>
                                            
                                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                <span>{item.location}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{item.date && formatDistanceToNow(item.date.toDate(), { addSuffix: true })}</span>
                                            </div>

                                            <p className="text-xs text-muted-foreground mt-2">Reported by: {item.reporterName}</p>

                                            <div className="flex gap-2 mt-3">
                                                {currentUser?.uid === item.reporterId ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => handleMarkResolved(item.id!)}
                                                    >
                                                        <Check className="h-4 w-4 mr-2" /> Resolved
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => handleContactClick(item)}
                                                    >
                                                        <MessageCircle className="h-4 w-4 mr-2" /> Contact
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Contact Reporter Dialog */}
                        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Contact {selectedItemForContact?.reporterName}</DialogTitle>
                                    <DialogDescription>
                                        Choose how you'd like to contact about "{selectedItemForContact?.title}"
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => handleCallNow(selectedItemForContact?.reporterContact || "")}
                                        className="w-full h-12 text-base gap-2"
                                        variant="outline"
                                    >
                                        <Phone className="h-5 w-5" />
                                        Call Now
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {selectedItemForContact?.reporterContact}
                                        </span>
                                    </Button>

                                    <Button
                                        onClick={() => handleChatWithReporter(selectedItemForContact!)}
                                        className="w-full h-12 text-base gap-2"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                        Chat Now
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </main>
            </div>
        </div>
    );
}
