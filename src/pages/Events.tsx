import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
// keep imports if you still use firebase features elsewhere; they won't be used for initial data
import { createEvent, rsvpEvent, cancelRsvp, uploadImage, Event, addEventComment, getEventComments, Comment } from "@/lib/firebase-utils";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { Calendar, Clock, MapPin, X, Image as ImageIcon, Plus, MessageCircle, Send } from "lucide-react";

const categories = [
  { value: 'all', label: 'All Events' },
  { value: 'fest', label: 'Fest' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'club', label: 'Club' },
  { value: 'competition', label: 'Competition' },
  { value: 'other', label: 'Other' },
];

/**
 * Helper: convert ISO date/time to Firestore-like { seconds: number } shape used in UI.
 */
function toSeconds(dateTimeIso: string) {
  return Math.floor(new Date(dateTimeIso).getTime() / 1000);
}

/**
 * HARD-CODED EVENTS
 * These are fixed in code. Add / edit items here.
 */
const HARD_CODED_EVENTS: Event[] = [
  {
    id: "evt-sathack-2025",
    title: "Sat Hack 2025",
    description: "Sat Hack is the Saturnalia Annual Tech Fest.",
    imageUrl: "", // put a URL if you have one
    date: { seconds: toSeconds("2025-11-15T17:00:00Z") } as any,
    time: "17:00",
    location: "Activity Space",
    category: "competition",
    organizerId: "org-1",
    organizerName: "Saturnalia Club",
    attendees: ["uid-example-1", "uid-example-2"],
    maxAttendees: 200,
  },
  {
    id: "evt-astratech-2025",
    title: "AstraTech Fest 2025",
    description: "AstraTech is the annual inter-college innovation and cultural festival.",
    imageUrl: "",
    date: { seconds: toSeconds("2025-12-10T09:00:00Z") } as any,
    time: "09:00",
    location: "Central Auditorium",
    category: "fest",
    organizerId: "org-2",
    organizerName: "AstraTech Committee",
    attendees: [],
    maxAttendees: 1000,
  },
  {
    id: "evt-ai-bootcamp-2026",
    title: "AI & ML Hands-On Bootcamp",
    description: "A practical workshop on Python, ML models, and deployment for beginners.",
    imageUrl: "",
    date: { seconds: toSeconds("2026-01-05T11:00:00Z") } as any,
    time: "11:00",
    location: "Tech Lab – Block C",
    category: "workshop",
    organizerId: "org-3",
    organizerName: "AI Club",
    attendees: [],
    maxAttendees: 50,
  },
  {
    id: "evt-web3-2025",
    title: "Future of Web3 & Blockchain",
    description: "An online webinar discussing real-world Web3 applications and careers.",
    imageUrl: "",
    date: { seconds: toSeconds("2025-12-22T19:30:00Z") } as any,
    time: "19:30",
    location: "Google Meet (Online)",
    category: "webinar",
    organizerId: "org-4",
    organizerName: "Blockchain Cell",
    attendees: [],
    maxAttendees: null,
  },
  {
    id: "evt-photo-walk-2025",
    title: "Photography Club – Street Walk 2025",
    description: "A photo-walk session focusing on street photography and storytelling.",
    imageUrl: "",
    date: { seconds: toSeconds("2025-12-03T16:00:00Z") } as any,
    time: "16:00",
    location: "Campus Main Gate",
    category: "club",
    organizerId: "org-5",
    organizerName: "Photography Club",
    attendees: [],
    maxAttendees: 40,
  },
  {
    id: "evt-roborally-2026",
    title: "RoboRally 2025",
    description: "A live robotics racing challenge open to all engineering branches.",
    imageUrl: "",
    date: { seconds: toSeconds("2026-01-20T10:00:00Z") } as any,
    time: "10:00",
    location: "Mechanical Block Arena",
    category: "competition",
    organizerId: "org-6",
    organizerName: "Robotics Club",
    attendees: [],
    maxAttendees: 120,
  },
  {
    id: "evt-blood-drive-2025",
    title: "Blood Donation Drive",
    description: "A social responsibility initiative organized for campus health awareness.",
    imageUrl: "",
    date: { seconds: toSeconds("2025-12-18T14:00:00Z") } as any,
    time: "14:00",
    location: "Health Centre Hall",
    category: "other",
    organizerId: "org-7",
    organizerName: "Health Cell",
    attendees: [],
    maxAttendees: null,
  },
  {
    id: "evt-codeclash-2025",
    title: "Code Clash (Hackathon)",
    description: "48-hour coding contest across algorithms, web and ML tracks.",
    imageUrl: "",
    date: { seconds: toSeconds("2025-11-25T10:00:00Z") } as any,
    time: "10:00",
    location: "CS Block - Lab 2",
    category: "competition",
    organizerId: "org-8",
    organizerName: "Coding Club",
    attendees: [],
    maxAttendees: 300,
  },
];

export default function Events() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventComments, setEventComments] = useState<Comment[]>([]);
  const [newEventComment, setNewEventComment] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: 'other' as Event['category'],
    maxAttendees: "",
  });

  // Instead of fetching from backend, we load the hard-coded events
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // load static events
    setEvents(HARD_CODED_EVENTS);
    setLoadingEvents(false);
  }, [currentUser]);

  // The rest of your functions remain the same — creating new events will still call your createEvent function.
  async function handleCreateEvent() {
    if (!formData.title.trim() || !formData.date || !formData.time || !formData.location.trim()) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!currentUser || !userProfile) return;

    setLoading(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, "events");
      }

      const eventDate = new Date(`${formData.date}T${formData.time}`);
      // build object shape consistent with existing events (date.seconds)
      const newEvent: Event = {
        id: `evt-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        imageUrl,
        date: { seconds: Math.floor(eventDate.getTime() / 1000) } as any,
        time: formData.time,
        location: formData.location,
        category: formData.category,
        organizerId: currentUser.uid,
        organizerName: userProfile.displayName || currentUser.displayName || "Anonymous",
        attendees: [],
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      };

      // Optionally call createEvent to persist to backend — keep or remove as required.
      await createEvent?.(newEvent).catch(() => {
        // If no backend or error, fallback to local-only addition
      });

      // Add to local hardcoded list (so it immediately appears)
      setEvents(prev => [newEvent, ...prev]);

      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "other",
        maxAttendees: "",
      });
      setImageFile(null);
      setImagePreview("");
      setCreateDialogOpen(false);

      toast({ title: "Event created successfully!" });
    } catch (error) {
      console.error("❌ Error creating event:", error);
      toast({ title: "Error creating event", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(event: Event) {
    if (!currentUser || !event.id) return;

    const isRSVPed = event.attendees?.includes(currentUser.uid);
    const isFull = event.maxAttendees && event.attendees?.length >= event.maxAttendees;

    if (!isRSVPed && isFull) {
      toast({ title: "Event is full", variant: "destructive" });
      return;
    }

    try {
      if (isRSVPed) {
        await cancelRsvp?.(event.id, currentUser.uid).catch(() => {});
        // local update
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees: (e.attendees || []).filter(a => a !== currentUser.uid) } : e));
        toast({ title: "RSVP cancelled" });
      } else {
        await rsvpEvent?.(event.id, currentUser.uid).catch(() => {});
        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, attendees: [...(e.attendees || []), currentUser.uid] } : e));
        toast({ title: "RSVP confirmed!" });
      }
    } catch (error) {
      toast({ title: "Error updating RSVP", variant: "destructive" });
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function openEventComments(event: Event) {
    setSelectedEvent(event);
    if (event.id) {
      try {
        const fetchedComments = await getEventComments?.(event.id) || [];
        setEventComments(fetchedComments);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast({ title: "Error loading comments", variant: "destructive" });
      }
    }
  }

  async function handleAddEventComment() {
    if (!newEventComment.trim() || !selectedEvent?.id || !currentUser) return;

    const authorName =
      userProfile?.displayName || currentUser.displayName || "Anonymous";
    const authorAvatar =
      userProfile?.photoURL || currentUser.photoURL || "";

    try {
      await addEventComment?.(selectedEvent.id, {
        authorId: currentUser.uid,
        authorName,
        authorAvatar,
        content: newEventComment,
      }).catch(() => {});

      setNewEventComment("");
      const fetchedComments = await getEventComments?.(selectedEvent.id) || [];
      setEventComments(fetchedComments);

      // Local increment isn't tracked here; you can update event comment count if you store one
      toast({ title: "Comment added successfully!" });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({ title: "Error adding comment", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  }

  const filteredEvents = filterCategory === 'all'
    ? events
    : events.filter(e => e.category === filterCategory);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const dateA = (a.date && (a.date as any).seconds) || 0;
    const dateB = (b.date && (b.date as any).seconds) || 0;
    return dateA - dateB;
  });

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 flex-1 w-full">
        <Header />

        <main className="mx-auto w-full max-w-6xl p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
              <p className="text-muted-foreground mt-1">Discover and join campus events</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              {/* <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </DialogTrigger> */}
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Tech Fest 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Join us for an exciting tech fest..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Main Auditorium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData({ ...formData, category: val as Event['category'] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.value !== 'all').map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxAttendees">Max Attendees (Optional)</Label>
                      <Input
                        id="maxAttendees"
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="image">Event Image (Optional)</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="event-image-upload"
                        onChange={handleImageSelect}
                      />
                      <label htmlFor="event-image-upload">
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                          <span>
                            <ImageIcon className="h-4 w-4" />
                            Upload Image
                          </span>
                        </Button>
                      </label>
                      {imagePreview && (
                        <div className="relative mt-3">
                          <img src={imagePreview} alt="Preview" className="max-h-48 rounded" />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => { setImageFile(null); setImagePreview(""); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={loading}>
                      {loading ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mb-6">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingEvents ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : sortedEvents.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No events found</p>
              <p className="text-muted-foreground mb-4">
                {filterCategory === 'all'
                  ? "Be the first to create an event!"
                  : "No events in this category. Try another filter."}
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedEvents.map((event, index) => {
                const isRSVPed = event.attendees?.includes(currentUser.uid);
                const attendeeCount = event.attendees?.length || 0;
                const isFull = event.maxAttendees && attendeeCount >= event.maxAttendees;
                const eventDate = event.date?.seconds
                  ? new Date((event.date as any).seconds * 1000)
                  : new Date();

                return (
                  <Card
                    key={event.id}
                    className="overflow-hidden shadow-soft hover:shadow-medium transition-smooth flex flex-col"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {event.imageUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-smooth hover:scale-105"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-background/90 text-foreground border">
                            {categories.find(c => c.value === event.category)?.label}
                          </Badge>
                        </div>
                      </div>
                    )}

                    <CardHeader>
                      {!event.imageUrl && (
                        <Badge className="w-fit mb-2">
                          {categories.find(c => c.value === event.category)?.label}
                        </Badge>
                      )}
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      {event.description && (
                        <CardDescription className="line-clamp-2">
                          {event.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(eventDate, 'MMM dd, yyyy')} · {formatDistanceToNow(eventDate, { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        {/* Example RSVP button left commented to match your original layout.
                            Un-comment if you want RSVP enabled for hard-coded events. */}
                        {/* <Button
                          className="flex-1"
                          variant={isRSVPed ? "outline" : "default"}
                          onClick={() => handleRSVP(event)}
                          disabled={!isRSVPed && isFull}
                        >
                          {isRSVPed ? "Cancel RSVP" : isFull ? "Event Full" : "RSVP"}
                        </Button> */}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex gap-3 pb-4 border-b">
                <Avatar>
                  <AvatarImage src={selectedEvent.imageUrl} />
                  <AvatarFallback>
                    {selectedEvent.title?.charAt(0) || "E"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    {selectedEvent.title}
                  </h4>
                  <p className="text-sm mt-1">{selectedEvent.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {eventComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.authorAvatar} />
                      <AvatarFallback className="text-xs">
                        {comment.authorName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted p-3 rounded-lg">
                      <h5 className="font-semibold text-xs">
                        {comment.authorName}
                      </h5>
                      <p className="text-sm mt-1">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {comment.createdAt &&
                          formatDistanceToNow((comment.createdAt as any).toDate?.() ?? new Date(), {
                            addSuffix: true,
                          })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  placeholder="Write a comment..."
                  value={newEventComment}
                  onChange={(e) => setNewEventComment(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddEventComment} disabled={!newEventComment.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
