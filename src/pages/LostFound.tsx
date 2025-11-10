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
import { createLostFoundItem, getLostFoundItems, uploadImage, LostFound, markLostFoundResolved, addComment, getComments, deleteComment, Comment } from "@/lib/firebase-utils";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, MapPin, Calendar, Phone, Check, X, MessageCircle, Send, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  const fetchedItems = await getLostFoundItems();
  setItems(fetchedItems || []);
    console.log("✅ Loaded lost and found items:", fetchedItems?.length || 0);
  } catch (error) {
  console.error("❌ Error loading items:", error);
  toast({
  title: "Error loading items",
    description: error instanceof Error ? error.message : "Failed to fetch lost and found items",
      variant: "destructive",
  });
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

  const handleSubmit = async (type: 'lost' | 'found') => {
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
  imageUrl = await uploadImage(imageFile, 'lostfound');
  }

  const result = await createLostFoundItem({
  title: formData.title,
  description: formData.description,
  category: formData.category,
  location: formData.location,
  date: new Date(formData.date) as any,
  type,
  reporterId: currentUser!.uid,
  reporterName: userProfile?.displayName || 'Anonymous',
  reporterContact: formData.contact,
  imageUrl,
  });

  console.log("✅ Item created:", result.id);
  toast({
  title: "Item reported successfully",
    description: `Your ${type} item has been posted`,
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
  await markLostFoundResolved(itemId);
  toast({
  title: "Item marked as resolved",
  });
  loadItems();
  } catch (error) {
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

   const filteredItems = items.filter(item => item.type === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex pt-16">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Lost & Found</h1>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'lost' | 'found')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="lost">Lost Items</TabsTrigger>
                <TabsTrigger value="found">Found Items</TabsTrigger>
              </TabsList>

              <TabsContent value="lost" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Report Lost Item</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="lost-title">Title *</Label>
                      <Input
                        id="lost-title"
                        placeholder="e.g., Black Wallet"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lost-description">Description *</Label>
                      <Textarea
                        id="lost-description"
                        placeholder="Describe the item in detail..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lost-category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger id="lost-category">
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
                        <Label htmlFor="lost-location">Location *</Label>
                        <Input
                          id="lost-location"
                          placeholder="e.g., Library"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lost-date">Date Lost *</Label>
                        <Input
                          id="lost-date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lost-contact">Contact *</Label>
                        <Input
                          id="lost-contact"
                          placeholder="Phone or Email"
                          value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="lost-image">Image (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="lost-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="flex-1"
                        />
                        {imagePreview && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                      )}
                    </div>
                    <Button onClick={() => handleSubmit('lost')} disabled={loading} className="w-full">
                      {loading ? "Reporting..." : "Report Lost Item"}
                    </Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Lost Items</h2>
                  {loadingItems ? (
                    <p>Loading...</p>
                  ) : filteredItems.length === 0 ? (
                    <p className="text-muted-foreground">No lost items reported</p>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title} className="h-24 w-24 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <Badge variant="destructive">Lost</Badge>
                                  <Badge variant="outline">{item.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {item.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {item.date && formatDistanceToNow(item.date.toDate(), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.location.href = `tel:${item.reporterContact}`;
                                }}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Contact Reporter
                              </Button>
                              {currentUser?.uid === item.reporterId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkResolved(item.id!)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark as Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="found" className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Report Found Item</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="found-title">Title *</Label>
                      <Input
                        id="found-title"
                        placeholder="e.g., Black Wallet"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="found-description">Description *</Label>
                      <Textarea
                        id="found-description"
                        placeholder="Describe the item in detail..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="found-category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger id="found-category">
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
                        <Label htmlFor="found-location">Location *</Label>
                        <Input
                          id="found-location"
                          placeholder="e.g., Library"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="found-date">Date Found *</Label>
                        <Input
                          id="found-date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="found-contact">Contact *</Label>
                        <Input
                          id="found-contact"
                          placeholder="Phone or Email"
                          value={formData.contact}
                          onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="found-image">Image (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="found-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="flex-1"
                        />
                        {imagePreview && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded" />
                      )}
                    </div>
                    <Button onClick={() => handleSubmit('found')} disabled={loading} className="w-full">
                      {loading ? "Reporting..." : "Report Found Item"}
                    </Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Found Items</h2>
                  {loadingItems ? (
                    <p>Loading...</p>
                  ) : filteredItems.length === 0 ? (
                    <p className="text-muted-foreground">No found items reported</p>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex gap-4">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.title} className="h-24 w-24 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <Badge className="bg-green-500">Found</Badge>
                                  <Badge variant="outline">{item.category}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {item.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {item.date && formatDistanceToNow(item.date.toDate(), { addSuffix: true })}
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  window.location.href = `tel:${item.reporterContact}`;
                                }}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Contact Reporter
                              </Button>
                              {currentUser?.uid === item.reporterId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkResolved(item.id!)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Mark as Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
