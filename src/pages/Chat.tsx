"use client";
import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Phone,
  Video,
  MoreVertical,
  Send,
  Smile,
  Paperclip,
  Users,
  UserPlus,
  Settings,
  MessageCircle,
  Check,
  X,
  Menu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
getFriends,
getUserChats,
getChatMessages,
sendMessage,
createDirectChat,
createGroupChat,
markChatAsRead,
sendFriendRequest,
getFriendRequests,
acceptFriendRequest,
declineFriendRequest,
FriendRequest,
subscribeToUserChats,
subscribeToChatMessages,
addParticipantsToGroup,
deleteMessage,
} from "@/lib/firebase-utils";
import type { Chat, ChatMessage } from "@/lib/firebase-utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Chat() {
  const { currentUser, userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [friends, setFriends] = useState<{ id: string; name: string; avatar?: string }[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"chats" | "friends">("chats");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [newChatDialog, setNewChatDialog] = useState(false);
  const [newGroupDialog, setNewGroupDialog] = useState(false);
  const [addMembersDialog, setAddMembersDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Real-time listener for chats
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Subscribe to chats in real-time
    const unsubscribeChats = subscribeToUserChats(
      currentUser.uid,
      (userChats) => {
        setChats(userChats);
        setLoading(false);
      },
      (error) => {
        console.error("Error in chats subscription:", error);
        toast.error("Failed to load chats");
        setLoading(false);
      }
    );

    // Load friends and friend requests
    loadData();

    // Cleanup listener on unmount
    return () => {
      unsubscribeChats();
    };
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      const [userFriends, userFriendRequests] = await Promise.all([
        getFriends(currentUser.uid).catch(err => {
          console.error("Error loading friends:", err);
          return [];
        }),
        getFriendRequests(currentUser.uid).catch(err => {
          console.error("Error loading friend requests:", err);
          return [];
        }),
      ]);

      setFriends(userFriends);
      setFriendRequests(userFriendRequests);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Real-time listener for messages when chat is selected
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    // Subscribe to messages in real-time
    const unsubscribeMessages = subscribeToChatMessages(
      selectedChat.id!,
      (chatMessages) => {
        setMessages(chatMessages);
      },
      (error) => {
        console.error("Error in messages subscription:", error);
        
        if (error.message?.includes("index")) {
          toast.error("Database index required. Check console for link to create it.");
        } else if (error.message?.includes('permission-denied')) {
          toast.error("Permission denied. Check Firebase rules are deployed.");
        } else {
          toast.error("Failed to load messages");
        }
      }
    );

    // Mark chat as read
    markChatAsRead(selectedChat.id!, currentUser.uid).catch(err => {
      console.error("Error marking chat as read:", err);
    });

    // Cleanup listener on unmount or chat change
    return () => {
      unsubscribeMessages();
    };
  }, [selectedChat, currentUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedChat || !currentUser) return;

    try {
      await sendMessage({
        chatId: selectedChat.id!,
        senderId: currentUser.uid,
        senderName: userProfile?.displayName || currentUser.displayName || "Anonymous",
        senderAvatar: userProfile?.photoURL || currentUser.photoURL,
        content: input.trim(),
        type: "text",
      });

      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleStartDirectChat = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const chatId = await createDirectChat(currentUser.uid, friendId);
      
      // The real-time listener will automatically update the chats list
      // Just wait a moment and select the chat
      setTimeout(() => {
        const newChat = chats.find(chat => chat.id === chatId);
        if (newChat) setSelectedChat(newChat);
      }, 500);

      setNewChatDialog(false);
      toast.success("Chat started!");
    } catch (error: any) {
      console.error("Error creating chat:", error);
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check Firebase rules are deployed.");
      } else {
        toast.error(error.message || "Failed to start chat");
      }
    }
  };

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedFriends.length === 0 || !currentUser) return;

    try {
      await createGroupChat(
        currentUser.uid,
        groupName.trim(),
        selectedFriends,
        groupDescription.trim() || undefined
      );

      const updatedChats = await getUserChats(currentUser.uid);
      setChats(updatedChats);

      // Reset form
      setGroupName("");
      setGroupDescription("");
      setSelectedFriends([]);
      setNewGroupDialog(false);

      toast.success("Group chat created!");
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast.error("Failed to create group chat");
    }
  };

  const handleAddMembers = async () => {
    if (!selectedChat || selectedFriends.length === 0 || !currentUser) return;

    try {
      await addParticipantsToGroup(selectedChat.id!, selectedFriends);
      
      setSelectedFriends([]);
      setAddMembersDialog(false);
      toast.success("Members added successfully!");
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast.error(error.message || "Failed to add members");
    }
  };

  const handleDeleteMessage = async (messageId: string | undefined) => {
    if (!currentUser || !messageId) {
      toast.error("Cannot delete message");
      return;
    }

    try {
      await deleteMessage(messageId, currentUser.uid);
      toast.success("Message deleted");
    } catch (error: any) {
      console.error("Error deleting message:", error);
      if (error.message?.includes("only delete your own")) {
        toast.error("You can only delete your own messages");
      } else if (error.message?.includes('permission-denied')) {
        toast.error("Permission denied. Check Firebase rules are deployed.");
      } else {
        toast.error(error.message || "Failed to delete message");
      }
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
  if (!currentUser || !userProfile) return;

  try {
  await sendFriendRequest({
  senderId: currentUser.uid,
  senderName: userProfile.displayName || currentUser.displayName || "Anonymous",
  senderAvatar: userProfile.photoURL || currentUser.photoURL,
  recipientId: friendId,
  recipientName: "Friend", // This should be the actual friend's name
  recipientAvatar: undefined,
  });

  toast.success("Friend request sent!");
  } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
  try {
  await acceptFriendRequest(requestId);
  loadData(); // Reload friends and requests
  toast.success("Friend request accepted!");
  } catch (error) {
  console.error("Error accepting friend request:", error);
  toast.error("Failed to accept friend request");
  }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
  try {
  await declineFriendRequest(requestId);
  loadData(); // Reload friends and requests
  toast.success("Friend request declined");
  } catch (error) {
  console.error("Error declining friend request:", error);
  toast.error("Failed to decline friend request");
  }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <MobileNav />
        <div className="lg:ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Please sign in</h2>
            <p className="text-muted-foreground">You need to be logged in to use chat features.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <MobileNav />
        <div className="lg:ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Chat</h2>
            <p className="text-muted-foreground">Setting up your conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  // Chat Sidebar Content Component
  const ChatSidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "chats" | "friends")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "chats" && (
        <>
          <div className="p-4 border-b border-border">
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
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No chats yet</div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setSelectedChat(chat);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full p-4 flex items-start gap-3 transition-smooth border-b border-border ${
                    selectedChat?.id === chat.id ? "bg-muted/50" : "hover:bg-muted/20"
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {chat.type === "group" ? "G" : chat.participantDetails?.find(p => p.id !== currentUser.uid)?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {chat.type === "group"
                          ? chat.name
                          : chat.participantDetails?.find(p => p.id !== currentUser.uid)?.name || "Unknown"}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {chat.lastMessage?.timestamp && formatDistanceToNow(chat.lastMessage.timestamp.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage ? `${chat.lastMessage.senderName}: ${chat.lastMessage.text}` : "No messages yet"}
                    </p>
                  </div>
                  {chat.unreadCount?.[currentUser.uid] > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 min-w-[20px] flex items-center justify-center rounded-full text-xs">
                      {chat.unreadCount[currentUser.uid]}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            <Dialog open={newChatDialog} onOpenChange={setNewChatDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start a new chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <p className="text-muted-foreground">No friends to chat with. Add some friends first!</p>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <Button
                          key={friend.id}
                          variant="ghost"
                          className="w-full justify-start gap-3"
                          onClick={() => handleStartDirectChat(friend.id)}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{friend.name}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={newGroupDialog} onOpenChange={setNewGroupDialog}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Users className="h-4 w-4" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a group chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <Input
                    placeholder="Group description (optional)"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select members</label>
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriends([...selectedFriends, friend.id]);
                            } else {
                              setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                            }
                          }}
                          className="rounded"
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{friend.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreateGroupChat}
                    disabled={!groupName.trim() || selectedFriends.length === 0}
                  >
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </>
      )}

      {activeTab === "friends" && (
        <>
          <div className="flex-1 overflow-y-auto">
            {friendRequests.length > 0 && (
              <div className="border-b border-border">
                <div className="p-4 bg-muted/50">
                  <h3 className="font-semibold text-sm mb-3">Friend Requests</h3>
                  <div className="space-y-2">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="bg-card p-3 rounded-lg flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.senderAvatar} />
                            <AvatarFallback>{request.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium truncate">{request.senderName}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 px-2"
                            onClick={() => handleAcceptFriendRequest(request.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => handleDeclineFriendRequest(request.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">All Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <p className="text-muted-foreground text-sm">No friends yet</p>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartDirectChat(friend.id)}
                      className="w-full p-2 flex items-center gap-3 hover:bg-muted/50 rounded-lg transition-smooth"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{friend.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <Button variant="outline" className="w-full gap-2">
              <UserPlus className="h-4 w-4" />
              Add Friend
            </Button>
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 flex-1 flex flex-col h-screen">
        <Header />

        <main className="flex-1 flex overflow-hidden pb-16 lg:pb-0">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex md:w-80 border-r border-border bg-card flex-col">
            <ChatSidebarContent />
          </div>

          {/* Mobile Sheet Sidebar */}
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden fixed top-20 left-4 z-50 h-10 w-10 rounded-full shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Chats & Friends</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-[calc(100%-5rem)]">
                <ChatSidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Chat Main */}
          <div className="flex-1 flex flex-col bg-background">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 bg-card">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar>
                      <AvatarImage src={selectedChat.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedChat.type === "group" ? "G" : selectedChat.participantDetails?.find(p => p.id !== currentUser.uid)?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-sm">
                        {selectedChat.type === "group"
                          ? selectedChat.name
                          : selectedChat.participantDetails?.find(p => p.id !== currentUser.uid)?.name || "Unknown"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedChat.type === "group"
                          ? `${selectedChat.participants.length} members`
                          : "Direct message"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {selectedChat.type === "group" && (
                          <>
                            <DropdownMenuItem onClick={() => setAddMembersDialog(true)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Chat Settings
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                        <p className="text-muted-foreground">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.senderId === currentUser.uid ? "justify-end" : ""
                        }`}
                      >
                        {msg.senderId !== currentUser.uid && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.senderAvatar} />
                            <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`flex flex-col ${msg.senderId === currentUser.uid ? "items-end" : ""}`}>
                          {msg.senderId !== currentUser.uid && selectedChat.type === "group" && (
                            <p className="text-xs text-muted-foreground mb-1">{msg.senderName}</p>
                          )}
                          <div className="flex items-start gap-2 group max-w-md">
                            <div
                              className={`rounded-2xl p-3 flex-1 ${
                                msg.deleted 
                                  ? "bg-muted/50 border border-dashed" 
                                  : msg.senderId === currentUser.uid
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                              }`}
                            >
                              <p className={`text-sm ${msg.deleted ? "italic text-muted-foreground" : ""}`}>
                                {msg.content}
                              </p>
                            </div>
                            {!msg.deleted && msg.senderId === currentUser.uid && msg.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 flex-shrink-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="text-destructive"
                                  >
                                    Delete Message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {msg.createdAt && formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })}
                          </p>
                        </div>
                        {msg.senderId === currentUser.uid && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.photoURL || currentUser.photoURL} />
                            <AvatarFallback>{userProfile?.displayName?.charAt(0) || currentUser.displayName?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
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
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-muted/50"
                    />
                    <Button
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!input.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">Select a chat</h2>
                  <p className="text-muted-foreground text-sm sm:text-base mb-4">
                    Choose a conversation to start messaging
                  </p>
                  <Button
                    className="md:hidden"
                    onClick={() => setMobileDrawerOpen(true)}
                  >
                    View Chats
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
