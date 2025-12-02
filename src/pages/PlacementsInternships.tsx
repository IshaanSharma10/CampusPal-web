import { useState, useEffect } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Briefcase, Calendar, ExternalLink, Bookmark } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Placement {
  id: string;
  title: string;
  company: string;
  description: string;
  applyLink: string;
  deadline: Timestamp;
  type: "Internship" | "Placement";
  postedBy: string;
  createdAt: Timestamp;
  applicants?: string[];
  logoURL?: string;
}

export default function PlacementsInternships() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [filter, setFilter] = useState<"All" | "Internship" | "Placement">("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "placements"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Placement[];
      setPlacements(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredPlacements = placements
    .filter((p) => filter === "All" || p.type === filter)
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getDeadlineText = (deadline: Timestamp) => {
    try {
      const date = deadline.toDate();
      const now = new Date();
      const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft < 0) return "Expired";
      if (daysLeft === 0) return "Today";
      if (daysLeft === 1) return "Tomorrow";
      return `${daysLeft} days left`;
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-background w-full p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Placements & Internships</h1>
          <p className="text-muted-foreground">
            Discover exciting opportunities to kickstart your career
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            {(["All", "Internship", "Placement"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="min-w-[100px]"
              >
                {f}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by company or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlacements.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No opportunities found</p>
            </div>
          ) : (
            filteredPlacements.map((placement) => (
              <Card key={placement.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                {/* Logo and Badge */}
                <div className="flex items-start justify-between">
                  {placement.logoURL ? (
                    <img
                      src={placement.logoURL}
                      alt={placement.company}
                      className="w-12 h-12 object-contain rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <Badge variant={placement.type === "Internship" ? "secondary" : "default"}>
                    {placement.type}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2">
                    {placement.title}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground">{placement.company}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {placement.description}
                  </p>
                </div>

                {/* Deadline */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Deadline: {getDeadlineText(placement.deadline)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(placement.applyLink, "_blank")}
                  >
                    Apply Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
