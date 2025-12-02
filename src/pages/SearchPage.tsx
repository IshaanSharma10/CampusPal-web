import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Heart, MessageCircle, X } from "lucide-react";

const activeFilters = [
  { type: "Clubs", value: "Design Club" },
  { type: "Department", value: "Art & Design" },
];

const results = [
  {
    type: "event",
    title: "Intro to User Experience Design",
    subtitle: "An event by the Design Club about the fundamentals of UX/UI design. Great for beginners!",
    date: "Tomorrow at 4:00 PM",
  },
  {
    type: "person",
    name: "Sarah Lane",
    role: "Graphic Design Major",
  },
  {
    type: "post",
    author: "Mark Chen",
    club: "Design Club",
    time: "2h ago",
    content: "Looking for feedback on my latest portfolio design. Anyone with experience in mobile UI design want to take a look? #uidesign #feedback",
    likes: 12,
    comments: 5,
  },
];

const filters = {
  clubs: ["Design Club", "UX/UI Association", "Art & Tech Society"],
  courses: ["Design 101", "Advanced UI", "Typography"],
  departments: ["Art & Design", "Computer Science", "Business"],
};

const suggestedClubs = [
  { name: "UX/UI Association", members: "1.2k Members" },
  { name: "Art & Tech Society", members: "850 Members" },
];

const trendingEvents = [
  { name: "Annual Tech Fair", date: "Fri, Nov 10 @ 10:00 AM" },
  { name: "Startup Pitch Night", date: "Sat, Nov 11 @ 6:00 PM" },
];

export default function SearchPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />
      
      <div className="lg:ml-64 flex-1 w-full">
        <Header />
        
        <main className="w-full p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Filters Sidebar */}
            <Card className="p-4 sm:p-6 h-fit shadow-soft animate-fade-in order-2 lg:order-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Filter by</h3>
                <Button variant="link" className="text-primary p-0 h-auto">Clear all</Button>
              </div>

              <div className="space-y-6">
                <div>
                  <button className="flex items-center justify-between w-full text-sm font-semibold mb-3">
                    <span>Clubs</span>
                    <span className="text-muted-foreground">▼</span>
                  </button>
                  <div className="space-y-2">
                    {filters.clubs.map((club) => (
                      <div key={club} className="flex items-center space-x-2">
                        <Checkbox id={`club-${club}`} defaultChecked={club === "Design Club"} />
                        <Label
                          htmlFor={`club-${club}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {club}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button className="flex items-center justify-between w-full text-sm font-semibold mb-3">
                    <span>Courses</span>
                    <span className="text-muted-foreground">▼</span>
                  </button>
                  <div className="space-y-2">
                    {filters.courses.map((course) => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox id={`course-${course}`} />
                        <Label
                          htmlFor={`course-${course}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {course}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <button className="flex items-center justify-between w-full text-sm font-semibold mb-3">
                    <span>Departments</span>
                    <span className="text-muted-foreground">▼</span>
                  </button>
                  <div className="space-y-2">
                    {filters.departments.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox id={`dept-${dept}`} defaultChecked={dept === "Art & Design"} />
                        <Label
                          htmlFor={`dept-${dept}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {dept}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Search Results */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 animate-slide-up order-1 lg:order-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold mb-2">Showing 124 results for 'Design'</h1>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Button variant="ghost" size="sm">Relevance ▼</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <Badge key={filter.value} variant="secondary" className="gap-2">
                      {filter.type}: {filter.value}
                      <button className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="people">People</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                {/* Event Result */}
                <Card className="p-4 hover:shadow-medium transition-smooth">
                  <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">
                    Event: Tomorrow at 4:00 PM
                  </Badge>
                  <h3 className="font-bold mb-2">Intro to User Experience Design</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    An event by the Design Club about the fundamentals of UX/UI design. Great for beginners!
                  </p>
                  <Button size="sm">RSVP</Button>
                </Card>

                {/* Person Result */}
                <Card className="p-4 hover:shadow-medium transition-smooth">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" alt="Sarah Lane" />
                      <AvatarFallback>SL</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-bold">Sarah Lane</h3>
                      <p className="text-sm text-muted-foreground">Graphic Design Major</p>
                    </div>
                    <Button>Connect</Button>
                  </div>
                </Card>

                {/* Post Result */}
                <Card className="p-4 hover:shadow-medium transition-smooth">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" alt="Mark Chen" />
                      <AvatarFallback>MC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">Mark Chen</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Posted in <span className="text-primary">Design Club</span> • 2h ago
                      </p>
                    </div>
                  </div>
                  <p className="text-sm mb-3">
                    Looking for feedback on my latest portfolio design. Anyone with experience in mobile UI design want to take a look? #uidesign #feedback
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <Heart className="h-4 w-4" />
                      12
                    </button>
                    <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      5
                    </button>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block space-y-6 animate-slide-up order-3" style={{ animationDelay: '200ms' }}>
              <Card className="p-4 shadow-soft">
                <h4 className="font-semibold text-sm mb-4">Suggested Clubs</h4>
                <div className="space-y-3">
                  {suggestedClubs.map((club) => (
                    <div key={club.name} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold">{club.name}</h5>
                        <p className="text-xs text-muted-foreground">{club.members}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4 shadow-soft">
                <h4 className="font-semibold text-sm mb-4">Trending Events</h4>
                <div className="space-y-3 text-sm">
                  {trendingEvents.map((event) => (
                    <div key={event.name}>
                      <h5 className="font-semibold">{event.name}</h5>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
