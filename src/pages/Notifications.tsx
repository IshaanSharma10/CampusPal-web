import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  UserPlus,
  Mail,
  Heart,
  MessageCircle,
  Search,
  Settings,
  Check,
  X,
  Clock,
  CheckCheck,
  Filter,
  Zap,
  Users,
  ThumbsUp,
  MessageSquare as MessageSquareIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, acceptFriendRequest, declineFriendRequest, Notification as NotificationType, createNotification } from "@/lib/firebase-utils";
import { toast } from "sonner";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Notification types with visual styling
const notificationTypes = {
  friend_request: {
    icon: UserPlus,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    label: "Friend Request"
  },
  like: {
    icon: ThumbsUp,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    label: "Like"
  },
  comment: {
    icon: MessageSquareIcon,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    label: "Comment"
  },
  message: {
    icon: Mail,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    label: "Message"
  }
};

// Empty state illustrations
const EmptyStateIllustration = ({ type }: { type: keyof typeof notificationTypes }) => {
  const config = notificationTypes[type];
  const Icon = config.icon;

  return (
    <div className={`w-16 h-16 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center mx-auto mb-4`}>
      <Icon className={`w-8 h-8 ${config.color}`} />
    </div>
  );
};

// Skeleton loading component
const NotificationSkeleton = () => (
  <Card className="p-4">
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  </Card>
);

export default function Notifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  // Don't render anything if not authenticated
  if (!currentUser) {
    return null;
  }

  const { data: notifications = [], isLoading, refetch, error } = useQuery({
    queryKey: ["notifications", currentUser?.uid],
    queryFn: () => currentUser ? getNotifications(currentUser.uid) : [],
    enabled: !!currentUser,
  });

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter(n => n.type === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.senderName.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationType[] } = {};

    filteredNotifications.forEach(notification => {
      if (!notification.createdAt) return;

      const date = notification.createdAt.toDate();
      let dateKey: string;

      if (isToday(date)) {
        dateKey = "Today";
      } else if (isYesterday(date)) {
        dateKey = "Yesterday";
      } else {
        dateKey = format(date, "MMMM d, yyyy");
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  // Calculate counts
  const unreadCount = notifications.filter(n => !n.read).length;
  const friendRequestCount = notifications.filter(n => n.type === "friend_request" && !n.read).length;
  const likeCount = notifications.filter(n => n.type === "like" && !n.read).length;
  const commentCount = notifications.filter(n => n.type === "comment" && !n.read).length;

  // Handler functions
  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      refetch();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleCreateTestNotification = async () => {
    if (!currentUser) return;
    try {
      await createNotification({
        recipientId: currentUser.uid,
        senderId: "test-sender",
        senderName: "Test User",
        senderAvatar: "/placeholder.svg",
        type: "like",
        message: "liked your test post.",
        postId: "test-post",
      });
      refetch();
      toast.success("Test notification created!");
    } catch (error) {
      toast.error("Failed to create test notification");
      console.error(error);
    }
  };

  const handleAcceptFriendRequest = async (notification: NotificationType) => {
    if (!notification.requestId || !notification.id) return;
    try {
      await acceptFriendRequest(notification.requestId);
      await markNotificationAsRead(notification.id);
      refetch();
      toast.success("Friend request accepted!");
    } catch (error) {
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (notification: NotificationType) => {
    if (!notification.requestId || !notification.id) return;
    try {
      await declineFriendRequest(notification.requestId);
      await markNotificationAsRead(notification.id);
      refetch();
      toast.success("Friend request declined");
    } catch (error) {
      toast.error("Failed to decline friend request");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      refetch();
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  return (
  <div className="flex min-h-screen w-full bg-background">
  <Sidebar />
  <MobileNav />

  <div className="lg:ml-64 flex-1 w-full">
  <Header />

  <main className="w-full container mx-auto max-w-6xl p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6">
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
  <div className="flex items-center gap-3">
  <div className="p-2 bg-primary/10 rounded-lg">
    <Bell className="h-6 w-6 text-primary" />
  </div>
  <div>
  <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
  <p className="text-sm text-muted-foreground">
  Stay updated with your latest activities
  </p>
  </div>
  </div>

  <div className="flex items-center gap-2">
  {unreadCount > 0 && (
  <Button
  variant="outline"
  size="sm"
  onClick={handleMarkAllRead}
  className="gap-2"
  >
    <CheckCheck className="h-4 w-4" />
      Mark all read
      </Button>
              )}
  </div>
  </div>

  {/* Search Bar */}
          <div className="relative mb-6">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
  placeholder="Search notifications..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="pl-10"
  />
  </div>

  {/* Tabs and Content */}
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-5 mb-6">
  <TabsTrigger value="all" className="gap-2">
  <Bell className="h-4 w-4" />
  All
  {unreadCount > 0 && (
  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
    {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
    )}
  </TabsTrigger>
  <TabsTrigger value="friend_request" className="gap-2">
  <UserPlus className="h-4 w-4" />
  Friends
  {friendRequestCount > 0 && (
  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
  {friendRequestCount}
  </Badge>
  )}
  </TabsTrigger>
  <TabsTrigger value="like" className="gap-2">
  <ThumbsUp className="h-4 w-4" />
  Likes
  {likeCount > 0 && (
  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
  {likeCount}
  </Badge>
  )}
  </TabsTrigger>
  <TabsTrigger value="comment" className="gap-2">
  <MessageSquareIcon className="h-4 w-4" />
  Comments
  {commentCount > 0 && (
  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
  {commentCount}
  </Badge>
  )}
  </TabsTrigger>
  <TabsTrigger value="message" className="gap-2">
                <Mail className="h-4 w-4" />
  Messages
  </TabsTrigger>
  </TabsList>

  <TabsContent value={activeTab} className="mt-0">
  <ScrollArea className="h-[calc(100vh-300px)]">
  {isLoading ? (
  <div className="space-y-4">
  {Array.from({ length: 5 }).map((_, i) => (
  <NotificationSkeleton key={i} />
                    ))}
  </div>
  ) : error ? (
  <Card className="p-8 text-center">
  <div className="text-red-500 mb-4">
  <X className="h-12 w-12 mx-auto" />
  </div>
    <h3 className="text-lg font-semibold mb-2">Error Loading Notifications</h3>
      <p className="text-muted-foreground mb-4">
          Something went wrong while loading your notifications.
          </p>
            <Button onClick={() => refetch()} variant="outline">
                Try Again
                </Button>
                </Card>
                ) : Object.keys(groupedNotifications).length === 0 ? (
                  <Card className="p-8 text-center">
                    <EmptyStateIllustration type={activeTab as keyof typeof notificationTypes} />
                    <h3 className="text-lg font-semibold mb-2">
                      {activeTab === "all" ? "No notifications yet" : `No ${notificationTypes[activeTab as keyof typeof notificationTypes]?.label.toLowerCase()}s`}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {activeTab === "all"
                        ? "When someone interacts with your posts or sends you a friend request, you'll see it here."
                        : `You'll see ${notificationTypes[activeTab as keyof typeof notificationTypes]?.label.toLowerCase()}s here.`
                      }
                    </p>
                    {activeTab === "all" && (
                      <Button onClick={handleCreateTestNotification} variant="outline">
                        Create Test Notification
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
                      <div key={date}>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                          {date}
                        </h3>
                        <div className="space-y-3">
                          {dateNotifications.map((notification) => {
                            const config = notificationTypes[notification.type];
                            const Icon = config.icon;

                            return (
                              <Card
                                key={notification.id}
                                className={`p-4 transition-all duration-200 hover:shadow-md cursor-pointer border-l-4 ${
                                  !notification.read
                                    ? "bg-muted/20 border-l-primary"
                                    : "bg-card border-l-transparent"
                                }`}
                                onClick={() => !notification.read && handleMarkAsRead(notification.id!)}
                              >
                                <div className="flex items-start gap-4">
                                  {/* Notification Type Icon */}
                                  <div className={`p-2 rounded-full ${config.bgColor} ${config.borderColor} border flex-shrink-0`}>
                                    <Icon className={`h-4 w-4 ${config.color}`} />
                                  </div>

                                  {/* User Avatar */}
                                  <Avatar className="flex-shrink-0">
                                    <AvatarImage
                                      src={notification.senderAvatar || "/placeholder.svg"}
                                      alt={notification.senderName}
                                    />
                                    <AvatarFallback>
                                      {notification.senderName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm leading-relaxed">
                                          <span className="font-semibold text-foreground">
                                            {notification.senderName}
                                          </span>
                                          {" "}
                                          <span className="text-muted-foreground">
                                            {notification.message}
                                          </span>
                                          {notification.content && (
                                            <span className="block mt-1 text-muted-foreground italic">
                                              "{notification.content.length > 100
                                                ? `${notification.content.substring(0, 100)}...`
                                                : notification.content}"
                                            </span>
                                          )}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <Clock className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {notification.createdAt
                                              ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                                              : ""
                                            }
                                          </span>
                                          {!notification.read && (
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {notification.type === "friend_request" && (
                                          <div className="flex gap-2">
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAcceptFriendRequest(notification);
                                              }}
                                              className="h-8 px-3"
                                            >
                                              <Check className="h-3 w-3 mr-1" />
                                              Accept
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeclineFriendRequest(notification);
                                              }}
                                              className="h-8 px-3"
                                            >
                                              <X className="h-3 w-3 mr-1" />
                                              Decline
                                            </Button>
                                          </div>
                                        )}

                                        {notification.type !== "friend_request" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Settings className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
