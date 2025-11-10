import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Plus,
    DollarSign,
    CheckCircle,
    MessageCircle,
    ImagePlus,
    Phone,
    MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    serverTimestamp,
    CollectionReference,
    DocumentData,
} from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { supabase } from "@/SupabaseConfig";
import { createDirectChat, sendMessage } from "@/lib/firebase-utils";

// ✅ Supabase upload utility
async function uploadImageToSupabase(file: File, folder: string): Promise<string> {
    const safeFileName = file.name.replace(/[^\w.-]/g, "_");
    const filePath = `${folder}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
        .from("study-materials") // ⚡ your public bucket
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from("study-materials")
        .getPublicUrl(filePath);

    if (!data?.publicUrl) throw new Error("Failed to get public URL");

    return data.publicUrl;
}

// ✅ Type definitions
interface ExtendedUserProfile {
    name?: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    department?: string;
    year?: string;
    bio?: string;
    contact?: string;
}

interface MarketplaceItem {
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

interface FormDataType {
    title: string;
    description: string;
    price: string;
    condition: MarketplaceItem["condition"];
    category: MarketplaceItem["category"];
    contact: string;
}

const conditionColors = {
    new: "bg-green-500/10 text-green-500 border-green-500/20",
    "like-new": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    good: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    fair: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

export default function Marketplace() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [category, setCategory] = useState<"all" | MarketplaceItem["category"]>("all");
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [selectedItemForContact, setSelectedItemForContact] = useState<MarketplaceItem | null>(null);

    const [formData, setFormData] = useState<FormDataType>({
        title: "",
        description: "",
        price: "",
        condition: "good",
        category: "other",
        contact: "",
    });

    const profile = userProfile as ExtendedUserProfile | null;

    // 🔹 Load listings
    async function loadItems() {
        try {
            setLoading(true);
            const colRef: CollectionReference<DocumentData> = collection(db, "marketplace");
            const q = category === "all" ? query(colRef, where("sold", "==", false)) : query(colRef, where("category", "==", category), where("sold", "==", false));
            const snapshot = await getDocs(q);
            const fetched: MarketplaceItem[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as MarketplaceItem),
            }));
            setItems(fetched);
        } catch (error: any) {
            console.error("Error loading items:", error);
            toast({
                title: "Error loading items",
                description: error.message || "Please try again later",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    // 🔹 Image preview
    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    // 🔹 Submit listing
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!currentUser) {
            toast({ title: "You must be logged in to list items", variant: "destructive" });
            return;
        }

        try {
            setUploading(true);
            let imageUrl = "";

            if (imageFile) {
                imageUrl = await uploadImageToSupabase(imageFile, "marketplace");
            }

            const sellerName =
                profile?.displayName ??
                currentUser.displayName ??
                currentUser.email?.split("@")[0] ??
                "Anonymous";

            const newItem: MarketplaceItem = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                imageUrl,
                category: formData.category,
                condition: formData.condition,
                sellerId: currentUser.uid,
                sellerName,
                sellerContact: formData.contact.trim(),
                sold: false,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "marketplace"), newItem);
            toast({ title: "Item listed successfully!" });

            setFormData({
                title: "",
                description: "",
                price: "",
                condition: "good",
                category: "other",
                contact: "",
            });
            setImageFile(null);
            setImagePreview("");
            setIsDialogOpen(false);
            loadItems();
        } catch (error: any) {
            console.error("Error creating listing:", error);
            toast({
                title: "Error creating listing",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    }

    // 🔹 Mark item as sold
    async function markAsSold(itemId: string) {
        try {
            await updateDoc(doc(db, "marketplace", itemId), { sold: true });
            toast({ title: "Item marked as sold!" });
            setItems(items.filter(item => item.id !== itemId));
        } catch (error: any) {
            toast({
                title: "Error updating item",
                description: error.message,
                variant: "destructive",
            });
        }
    }

    // 🔹 Contact seller - show options dialog
    function handleContactClick(item: MarketplaceItem) {
        setSelectedItemForContact(item);
        setContactDialogOpen(true);
    }

    // 🔹 Call seller
    function handleCallNow(contact: string) {
        window.location.href = `tel:${contact}`;
        setContactDialogOpen(false);
    }

    // 🔹 Chat with seller
    async function handleChatWithSeller(item: MarketplaceItem) {
        if (!currentUser) {
            toast({ title: "Please log in to chat", variant: "destructive" });
            return;
        }

        try {
            const chatId = await createDirectChat(currentUser.uid, item.sellerId);
            
            // Send default message about the product
            const defaultMessage = `Hi ${item.sellerName}, I'm interested in your product: "${item.title}". Can you provide more details?`;
            
            await sendMessage({
                chatId: chatId,
                senderId: currentUser.uid,
                senderName: profile?.displayName || currentUser.displayName || "Anonymous",
                senderAvatar: profile?.photoURL || currentUser.photoURL,
                content: defaultMessage,
                type: "text",
            });

            // Navigate to chat page
            navigate("/chat");
            setContactDialogOpen(false);
            toast({ title: "Chat started!", description: `Now chatting with ${item.sellerName}` });
        } catch (error: any) {
            console.error("Error starting chat:", error);
            toast({
                title: "Error starting chat",
                description: error.message || "Please try again",
                variant: "destructive",
            });
        }
    }

    useEffect(() => {
        if (!currentUser) {
            navigate("/login");
            return;
        }
        loadItems();
    }, [currentUser, category]);

    if (!currentUser) return null;

    return (
        <div className="flex min-h-screen w-full bg-background">
            <Sidebar />
            <MobileNav />

            <div className="lg:ml-64 flex-1">
                <Header />

                <main className="p-4 sm:p-6 pb-20 lg:pb-6">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-slide-up">
                            <div>
                                <h1 className="text-3xl font-bold mb-1">Marketplace</h1>
                                <p className="text-muted-foreground">Buy and sell items with fellow students</p>
                            </div>

                            {/* Dialog for new listing */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" /> Create Listing
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Create New Listing</DialogTitle>
                                        <DialogDescription>Add details about your item for sale.</DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label>Title</Label>
                                            <Input
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="e.g., MacBook Pro 2021"
                                            />
                                        </div>

                                        <div>
                                            <Label>Description</Label>
                                            <Textarea
                                                required
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Describe your item..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Price (₹)</Label>
                                                <Input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <Label>Condition</Label>
                                                <Select
                                                    value={formData.condition}
                                                    onValueChange={(v) =>
                                                        setFormData({ ...formData, condition: v as MarketplaceItem["condition"] })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="new">New</SelectItem>
                                                        <SelectItem value="like-new">Like New</SelectItem>
                                                        <SelectItem value="good">Good</SelectItem>
                                                        <SelectItem value="fair">Fair</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Category</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(v) =>
                                                    setFormData({ ...formData, category: v as MarketplaceItem["category"] })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="books">Books</SelectItem>
                                                    <SelectItem value="electronics">Electronics</SelectItem>
                                                    <SelectItem value="clothing">Clothing</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Contact Info</Label>
                                            <Input
                                                required
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                placeholder="Phone or email"
                                            />
                                        </div>

                                        <div>
                                            <Label>Image</Label>
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
                                                            onChange={handleImageChange}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full" disabled={uploading}>
                                            {uploading ? "Creating..." : "Create Listing"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Tabs */}
                        <Tabs
                            value={category}
                            onValueChange={(v) => setCategory(v as "all" | MarketplaceItem["category"])}
                            className="w-full"
                        >
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="books">Books</TabsTrigger>
                                <TabsTrigger value="electronics">Electronics</TabsTrigger>
                                <TabsTrigger value="clothing">Clothing</TabsTrigger>
                                <TabsTrigger value="other">Other</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Items */}
                        {loading ? (
                            <div className="text-center py-12 text-muted-foreground">Loading items...</div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">No items found</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {items.map((item) => (
                                    <Card key={item.id} className="overflow-hidden">
                                        <div className="aspect-square bg-muted overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImagePlus className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <Badge variant="outline" className={conditionColors[item.condition]}>
                                                {item.condition}
                                            </Badge>
                                            <h3 className="font-bold text-lg mt-2">{item.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {item.description}
                                            </p>
                                            <p className="text-primary font-semibold mt-2">₹{item.price}</p>
                                            <p className="text-xs text-muted-foreground">Seller: {item.sellerName}</p>

                                            <div className="flex gap-2 mt-3">
                                                {currentUser.uid === item.sellerId ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                        onClick={() => markAsSold(item.id!)}
                                                    >
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Sold
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

                        {/* Contact Seller Dialog */}
                        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Contact {selectedItemForContact?.sellerName}</DialogTitle>
                                    <DialogDescription>
                                        Choose how you'd like to contact the seller about "{selectedItemForContact?.title}"
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-3">
                                    <Button
                                        onClick={() => handleCallNow(selectedItemForContact?.sellerContact || "")}
                                        className="w-full h-12 text-base gap-2"
                                        variant="outline"
                                    >
                                        <Phone className="h-5 w-5" />
                                        Call Now
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            {selectedItemForContact?.sellerContact}
                                        </span>
                                    </Button>

                                    <Button
                                        onClick={() => handleChatWithSeller(selectedItemForContact!)}
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
