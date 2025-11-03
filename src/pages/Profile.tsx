import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Link as LinkIcon, Mail, Heart, MessageCircle, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const posts = [
  {
    id: 1,
    content: "Just finished my final project for CS 301! So proud of what we built. Thanks to everyone who helped along the way! 🎉",
    time: "2 hours ago",
    likes: 45,
    comments: 8,
    shares: 3,
  },
  {
    id: 2,
    content: "Had an amazing time at the hackathon this weekend. Our team built a campus navigation app!",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
    time: "2 days ago",
    likes: 78,
    comments: 12,
    shares: 5,
  },
];

const friends = [
  { name: "Emily Carter", major: "Biology", avatar: "/placeholder.svg" },
  { name: "Sarah Johnson", major: "Psychology", avatar: "/placeholder.svg" },
  { name: "Mike Chen", major: "Engineering", avatar: "/placeholder.svg" },
  { name: "Alex Smith", major: "Business", avatar: "/placeholder.svg" },
];

export default function Profile() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:ml-64 flex-1">
        <Header />
        
        <main className="animate-slide-up pb-20 lg:pb-0">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
              {/* Left Sidebar - Profile Info */}
              <div className="space-y-6">
                <Card className="p-6 shadow-soft">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar className="h-32 w-32 mb-4 border-4 border-primary/20">
                      <AvatarImage src="/placeholder.svg" alt="Alex Chen" />
                      <AvatarFallback className="text-3xl">AC</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold mb-1">Alex Chen</h1>
                    <p className="text-sm text-primary">@alexchen</p>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">BIO</h3>
                      <p className="text-sm leading-relaxed">
                        Aspiring software engineer and coffee enthusiast. Exploring the intersection of technology and design. Go Bears!
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Computer Science</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Junior</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-6">Edit Profile</Button>
                </Card>

                {/* Clubs Section */}
                <Card className="p-6 shadow-soft">
                  <h3 className="font-bold text-sm mb-4 uppercase text-muted-foreground">My Communities</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Computer Science Dept.", icon: "💻" },
                      { name: "Chess Club", icon: "♟️" },
                      { name: "Hiking Group", icon: "🥾" }
                    ].map((club) => (
                      <div key={club.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-smooth cursor-pointer">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                          {club.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold truncate">{club.name}</h5>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Content - Posts & Friends */}
              <div className="space-y-6">
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="w-full bg-card">
                    <TabsTrigger value="posts" className="flex-1">My Posts</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="space-y-4 mt-6">
                    {posts.map((post) => (
                      <Card key={post.id} className="overflow-hidden shadow-soft hover:shadow-medium transition-smooth">
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src="/placeholder.svg" alt="Alex Chen" />
                              <AvatarFallback>AC</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">Alex Chen</h4>
                              <p className="text-xs text-muted-foreground">{post.time}</p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed mb-3">{post.content}</p>
                          {post.image && (
                            <img
                              src={post.image}
                              alt="Post content"
                              className="w-full rounded-lg mb-3"
                            />
                          )}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-around p-2">
                          <Button variant="ghost" size="sm" className="gap-2 flex-1">
                            <Heart className="h-4 w-4" />
                            <span className="text-xs">{post.likes}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 flex-1">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{post.comments}</span>
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-2 flex-1">
                            <Share2 className="h-4 w-4" />
                            <span className="text-xs">{post.shares}</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="friends" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {friends.map((friend) => (
                        <Card key={friend.name} className="p-4 hover:shadow-medium transition-smooth">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={friend.avatar} alt={friend.name} />
                              <AvatarFallback>
                                {friend.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate">{friend.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">{friend.major}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
