import { Sidebar } from "@/components/Sidebar";
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
      
      <div className="ml-64 flex-1">
        <Header />
        
        <main className="animate-slide-up">
          {/* Cover & Profile */}
          <div className="relative">
            <div className="h-48 gradient-hero" />
            <div className="container max-w-5xl mx-auto px-6">
              <div className="relative -mt-20 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-medium">
                    <AvatarImage src="/placeholder.svg" alt="Alex Doe" />
                    <AvatarFallback className="text-3xl">AD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-card rounded-lg p-6 shadow-soft">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-2xl font-bold mb-1">Alex Doe</h1>
                          <p className="text-muted-foreground">Computer Science Major</p>
                        </div>
                        <Button>Edit Profile</Button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Campus University</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Joined September 2022</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          <a href="#" className="text-primary hover:underline">portfolio.com</a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>alex.doe@campus.edu</span>
                        </div>
                      </div>
                      <div className="flex gap-6 mt-4 pt-4 border-t border-border">
                        <div>
                          <div className="text-xl font-bold">245</div>
                          <div className="text-xs text-muted-foreground">Posts</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">892</div>
                          <div className="text-xs text-muted-foreground">Friends</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold">12</div>
                          <div className="text-xs text-muted-foreground">Clubs</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container max-w-5xl mx-auto px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="posts" className="flex-1">My Posts</TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
                  </TabsList>

                  <TabsContent value="posts" className="space-y-4 mt-6">
                    {posts.map((post) => (
                      <Card key={post.id} className="overflow-hidden shadow-soft hover:shadow-medium transition-smooth">
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar>
                              <AvatarImage src="/placeholder.svg" alt="Alex Doe" />
                              <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">Alex Doe</h4>
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
                    <div className="grid grid-cols-2 gap-4">
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

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-4 shadow-soft">
                  <h3 className="font-bold text-sm mb-4">About</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Computer Science student passionate about web development and AI. 
                    Love building things that make a difference!
                  </p>
                </Card>

                <Card className="p-4 shadow-soft">
                  <h3 className="font-bold text-sm mb-4">Clubs & Organizations</h3>
                  <div className="space-y-3">
                    {["Computer Science Club", "Hiking Group", "Design Club"].map((club) => (
                      <div key={club} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold truncate">{club}</h5>
                          <p className="text-xs text-muted-foreground">Member</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 shadow-soft">
                  <h3 className="font-bold text-sm mb-4">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Web Development", "AI/ML", "Hiking", "Photography", "Music"].map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
