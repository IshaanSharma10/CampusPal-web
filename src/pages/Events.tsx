import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const events = [
  {
    id: 1,
    title: "Annual Hackathon",
    date: "Wed, Oct 26, 7:00 PM",
    location: "Innovation Hall",
    attendees: 128,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop",
    category: "Academic",
  },
  {
    id: 2,
    title: "Fall Music Fest",
    date: "Sat, Oct 29, 2:00 PM",
    location: "Main Quad",
    attendees: 450,
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&auto=format&fit=crop",
    category: "Social",
  },
];

export default function Events() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header />
        
        <main className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="lg:col-span-2 space-y-6 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Upcoming Events</h1>
                  <p className="text-muted-foreground">Discover what's happening around campus.</p>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="sports">Sports</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-4">
                {events.map((event, index) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-medium transition-smooth cursor-pointer animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="md:flex">
                      <div className="md:w-64 h-48 md:h-auto overflow-hidden">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover transition-smooth hover:scale-105"
                        />
                      </div>
                      <div className="p-6 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Badge variant="secondary" className="mb-2">
                              {event.category}
                            </Badge>
                            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{event.attendees} attendees</span>
                          </div>
                        </div>
                        <Button>View Details</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Event Details Sidebar */}
            <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Card className="overflow-hidden shadow-soft">
                <div className="h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop"
                    alt="Annual Hackathon"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">Annual Hackathon</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Organized by <span className="text-primary font-medium">Computer Science Club</span>
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date & Time
                      </h4>
                      <p className="text-sm text-muted-foreground ml-6">
                        Wednesday, October 26, 2024<br />
                        7:00 PM - 9:00 PM
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </h4>
                      <p className="text-sm text-muted-foreground ml-6">
                        Innovation Hall, Room 201<br />
                        <Button variant="link" className="p-0 h-auto text-primary">
                          View on map
                        </Button>
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-sm mb-2">About this event</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Join us for a 24-hour coding marathon where you can build amazing projects, 
                      learn new skills, and network with fellow students and industry professionals. 
                      Food, drinks, and prizes will be provided!
                    </p>
                  </div>

                  <Button className="w-full">RSVP</Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
