import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Phone, Video, MoreVertical, Send, Smile, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const conversations = [
  {
    id: 1,
    name: "Emily Carter",
    avatar: "/placeholder.svg",
    lastMessage: "Yeah, I did. I'll send them ov...",
    time: "10:42 AM",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    name: "Chem 101 Study Group",
    avatar: "/placeholder.svg",
    lastMessage: "Alex: Don't forget the quiz tom...",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    name: "Alex Johnson",
    avatar: "/placeholder.svg",
    lastMessage: "Let's meet at the library at 3.",
    time: "2d ago",
    unread: 0,
    online: false,
  },
  {
    id: 4,
    name: "Design Club",
    avatar: "/placeholder.svg",
    lastMessage: "New project brief is up!",
    time: "11:15 AM",
    unread: 1,
    online: false,
  },
];

const messages = [
  {
    id: 1,
    sender: "Emily Carter",
    content: "Hey! Did you get the notes from yesterday's lecture?",
    time: "10:40 AM",
    isMe: false,
  },
  {
    id: 2,
    sender: "Me",
    content: "Yeah, I did. I'll send them over. One sec.",
    time: "10:41 AM",
    isMe: true,
  },
  {
    id: 3,
    sender: "Emily Carter",
    content: "Here you go! Let me know if you can read my handwriting haha.",
    time: "10:42 AM",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop",
    isMe: false,
  },
  {
    id: 4,
    sender: "Me",
    content: "Perfect, thanks so much! You're a lifesaver.",
    time: "10:41 AM",
    isMe: true,
  },
];

export default function Chat() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="ml-64 flex-1 flex flex-col h-screen">
        <Header />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card flex flex-col animate-fade-in">
            <div className="p-4 border-b border-border">
              <h2 className="text-2xl font-bold mb-4">Chats</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search chats..."
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-smooth border-b border-border ${
                    conv.id === 1 ? "bg-muted/50" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conv.avatar} alt={conv.name} />
                      <AvatarFallback>{conv.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate">{conv.name}</h4>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center rounded-full text-xs">
                      {conv.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-border">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                New Message
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-background animate-slide-up">
            {/* Chat Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src="/placeholder.svg" alt="Emily Carter" />
                    <AvatarFallback>EC</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Emily Carter</h3>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex justify-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
              </div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isMe ? "justify-end" : ""}`}>
                  {!msg.isMe && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt={msg.sender} />
                      <AvatarFallback>EC</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-md ${msg.isMe ? "items-end" : ""}`}>
                    <div
                      className={`rounded-2xl p-3 ${
                        msg.isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="Shared content"
                          className="mt-2 rounded-lg max-w-full"
                        />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">{msg.time}</span>
                  </div>
                  {msg.isMe && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg" alt="You" />
                      <AvatarFallback>ME</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-border bg-card p-4">
              <div className="flex items-end gap-3">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1 bg-muted/50"
                />
                <Button size="icon" className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
