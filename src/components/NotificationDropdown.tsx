import { Bell, UserPlus, ThumbsUp, MessageSquare, Mail, Clock, CheckCheck, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    type Notification
} from "@/lib/firebase-utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const notificationTypes = {
    friend_request: {
        icon: UserPlus,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    like: {
        icon: ThumbsUp,
        color: "text-pink-600",
        bgColor: "bg-pink-50 dark:bg-pink-950",
    },
    comment: {
        icon: MessageSquare,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950",
    },
    message: {
        icon: Mail,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950",
    }
};

export const NotificationDropdown = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const { data: notifications = [], refetch } = useQuery({
        queryKey: ["notifications", currentUser?.uid],
        queryFn: () => currentUser ? getNotifications(currentUser.uid) : [],
        enabled: !!currentUser,
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const recentNotifications = notifications.slice(0, 5);

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

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            refetch();
        } catch (error) {
            toast.error("Failed to mark as read");
        }
    };

    const handleAcceptFriendRequest = async (notification: Notification) => {
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

    const handleDeclineFriendRequest = async (notification: Notification) => {
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

    const handleViewAll = () => {
        setIsOpen(false);
        navigate("/notifications");
    };

    if (!currentUser) {
        return null;
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-0">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold text-base">Notifications</h3>
                        {unreadCount > 0 && (
                            <p className="text-xs text-muted-foreground">
                                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            className="h-8 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {recentNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {recentNotifications.map((notification) => {
                                const config = notificationTypes[notification.type];
                                const Icon = config.icon;

                                return (
                                    <Card
                                        key={notification.id}
                                        className={`p-3 border-l-2 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read
                                                ? "bg-muted/20 border-l-primary"
                                                : "bg-card border-l-transparent"
                                            }`}
                                        onClick={() => !notification.read && handleMarkAsRead(notification.id!)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-1.5 rounded-full ${config.bgColor} flex-shrink-0`}>
                                                <Icon className={`h-3 w-3 ${config.color}`} />
                                            </div>

                                            <Avatar className="flex-shrink-0 h-8 w-8">
                                                <AvatarImage
                                                    src={notification.senderAvatar || "/placeholder.svg"}
                                                    alt={notification.senderName}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {notification.senderName.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs leading-relaxed">
                                                    <span className="font-semibold">
                                                        {notification.senderName}
                                                    </span>
                                                    {" "}
                                                    <span className="text-muted-foreground">
                                                        {notification.message}
                                                    </span>
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {notification.createdAt
                                                            ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true })
                                                            : ""
                                                        }
                                                    </span>
                                                    {!notification.read && (
                                                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                                                    )}
                                                </div>

                                                {notification.type === "friend_request" && (
                                                    <div className="flex gap-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAcceptFriendRequest(notification);
                                                            }}
                                                            className="h-7 text-xs px-2"
                                                        >
                                                            Accept
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeclineFriendRequest(notification);
                                                            }}
                                                            className="h-7 text-xs px-2"
                                                        >
                                                            Decline
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                <div className="border-t p-2">
                    <Button
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={handleViewAll}
                    >
                        View all notifications
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
