import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Heart, MessageCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const myCommunities = [
  { name: "Discover", icon: "🔍" },
  { name: "Chess Club", icon: "♟️" },
  { name: "Computer Science Dept.", icon: "💻" },
  { name: "Hiking Group", icon: "🥾" },
];

const clubs = [
  {
    id: 1,
    name: "Hiking Group",
    description: "Explore local trails and nature.",
    members: 78,
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Photography Club",
    description: "Capture moments, share stories.",
    members: 156,
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&auto=format&fit=crop",
  },
];

const posts = [
  {
    id: 1,
    author: "Sarah Day",
    role: "Club President",
    time: "2h ago",
    avatar: "/placeholder.svg",
    content: "Hey everyone! Just a reminder that our first tournament of the semester is this Friday at 7 PM in the student union. Pizza will be provided. Hope to see you all there! 🍕♟️",
    likes: 12,
    comments: 3,
  },
  {
    id: 2,
    author: "Mike Chen",
    role: "",
    time: "1 day ago",
    avatar: "/placeholder.svg",
    content: "Had a great time at the park today playing some blitz games. Beautiful weather for it!",
    image: "https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=800&auto=format&fit=crop",
    likes: 7,
    comments: 2,
  },
];

export default function Clubs() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* My Communities Sidebar */}
            <Card className="p-6 h-fit shadow-soft animate-fade-in">
              <h3 className="font-bold text-sm mb-4 text-muted-foreground">MY COMMUNITIES</h3>
              <div className="space-y-2">
                {myCommunities.map((community, index) => (
                  <Button
                    key={community.name}
                    variant={index === 0 ? "default" : "ghost"}
                    className="w-full justify-start gap-3 animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-lg">{community.icon}</span>
                    <span className="text-sm">{community.name}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 animate-slide-up">
              <div>
                <h1 className="text-3xl font-bold mb-2">Explore Campus Communities</h1>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Find your community..."
                    className="pl-10 bg-muted/50"
                  />
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="arts">Arts & Cult.</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                {clubs.map((club, index) => (
                  <Card
                    key={club.id}
                    className="overflow-hidden hover:shadow-medium transition-smooth animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex">
                      <div className="w-32 h-32 overflow-hidden shrink-0">
                        <img
                          src={club.image}
                          alt={club.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-bold mb-1">{club.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{club.description}</p>
                        <p className="text-xs text-muted-foreground mb-3">{club.members} Members</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Club Details Sidebar */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Card className="overflow-hidden shadow-soft">
                <div className="h-32 gradient-hero" />
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-4xl">♟️</div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-1">Chess Club</h3>
                      <p className="text-xs text-muted-foreground">A community for chess enthusiasts.</p>
                    </div>
                  </div>
                  <Button className="w-full mb-4">Join</Button>
                </div>
              </Card>

              <Card className="p-4 shadow-soft">
                <h4 className="font-semibold text-sm mb-4">Suggested Clubs</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">🎨</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold">UX/UI Association</h5>
                      <p className="text-xs text-muted-foreground">1.2k Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">🎭</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold">Art & Tech Society</h5>
                      <p className="text-xs text-muted-foreground">850 Members</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 shadow-soft">
                <h4 className="font-semibold text-sm mb-4">Trending Events</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <h5 className="font-semibold">Annual Tech Fair</h5>
                    <p className="text-xs text-muted-foreground">Fri, Nov 10 @ 10:00 AM</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Startup Pitch Night</h5>
                    <p className="text-xs text-muted-foreground">Sat, Nov 11 @ 6:00 PM</p>
                  </div>
                </div>
              </Card>

              {/* Club Posts */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4 shadow-soft">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.avatar} alt={post.author} />
                        <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold">{post.author}</h4>
                        <p className="text-xs text-muted-foreground">
                          {post.role && `${post.role} • `}{post.time}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mb-3 leading-relaxed">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="w-full rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Heart className="h-4 w-4" />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
