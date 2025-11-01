import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, UserPlus, Mail, Heart, MessageCircle, ChevronRight } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "friend_request",
    user: "Leo Messi",
    avatar: "/placeholder.svg",
    message: "sent you a friend request.",
    time: "2 minutes ago",
    unread: true,
  },
  {
    id: 2,
    type: "friend_request",
    user: "Sophia Chen",
    avatar: "/placeholder.svg",
    message: "sent you a friend request.",
    time: "15 minutes ago",
    unread: true,
  },
  {
    id: 3,
    type: "like",
    user: "Maria Garcia",
    avatar: "/placeholder.svg",
    message: "and 2 others liked your photo.",
    time: "28 minutes ago",
    unread: false,
  },
  {
    id: 4,
    type: "comment",
    user: "Ken Adams",
    avatar: "/placeholder.svg",
    message: 'commented: "Looks like a great study spot! Where is this?"',
    time: "45 minutes ago",
    unread: false,
  },
  {
    id: 5,
    type: "message",
    user: "Sarah Johnson",
    avatar: "/placeholder.svg",
    message: "",
    content: "You have a new message from Sarah Johnson.",
    time: "1 hour ago",
    unread: false,
  },
];

const filters = [
  { id: "all", label: "All", count: 7, icon: Bell },
  { id: "friend_requests", label: "Friend Requests", count: 2, icon: UserPlus },
  { id: "messages", label: "New Messages", count: 1, icon: Mail },
  { id: "likes", label: "Likes", count: 3, icon: Heart },
  { id: "comments", label: "Comments", count: 1, icon: MessageCircle },
];

export default function Notifications() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <Card className="p-6 h-fit shadow-soft animate-fade-in">
              <h3 className="font-bold mb-4">Filters</h3>
              <p className="text-xs text-muted-foreground mb-4">Manage your alerts</p>
              <div className="space-y-2">
                {filters.map((filter, index) => (
                  <Button
                    key={filter.id}
                    variant={index === 0 ? "default" : "ghost"}
                    className="w-full justify-start gap-3 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <filter.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{filter.label}</span>
                    <Badge
                      variant={index === 0 ? "secondary" : "outline"}
                      className="ml-auto"
                    >
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Notifications List */}
            <div className="lg:col-span-3 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Notifications</h1>
                <Button variant="ghost">Mark all as read</Button>
              </div>

              {notifications.map((notification, index) => (
                <Card
                  key={notification.id}
                  className={`p-4 transition-smooth hover:shadow-medium cursor-pointer animate-scale-in ${
                    notification.unread ? "bg-muted/30" : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={notification.avatar} alt={notification.user} />
                      <AvatarFallback>
                        {notification.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{notification.user}</span>{" "}
                        {notification.message}
                        {notification.content && (
                          <span className="block mt-1">{notification.content}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>

                    {notification.type === "friend_request" && (
                      <div className="flex gap-2">
                        <Button size="sm">Accept</Button>
                        <Button size="sm" variant="ghost">Decline</Button>
                      </div>
                    )}
                    
                    {notification.type !== "friend_request" && (
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
