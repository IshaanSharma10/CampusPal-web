import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendFriendRequest } from "@/lib/firebase-utils";
import { Search, UserPlus, Mail, Calendar, BookOpen } from "lucide-react";

interface StudentProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  profilePic?: string; // ✅ Supabase profile picture URL
  department?: string;
  batch?: string;
  bio?: string;
  interests?: string[];
}

export default function Directory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);

  const departments = [
    "all",
    "Computer Science",
    "Engineering",
    "Business",
    "Arts",
    "Science",
    "Medicine",
  ];

  const batches = ["all", "2021", "2022", "2023", "2024", "2025"];

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadStudents();
  }, [currentUser]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, selectedDepartment, selectedBatch, students]);

  async function loadStudents() {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      const studentData = snapshot.docs
        .map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as StudentProfile[];

      const filtered = studentData.filter(
        (student) => student.uid !== currentUser?.uid
      );

      setStudents(filtered);
      setFilteredStudents(filtered);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({ title: "Error loading students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function filterStudents() {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter((student) =>
        student.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (student) => student.department === selectedDepartment
      );
    }

    if (selectedBatch !== "all") {
      filtered = filtered.filter((student) => student.batch === selectedBatch);
    }

    setFilteredStudents(filtered);
  }

  async function handleConnect(student: StudentProfile) {
    if (!currentUser) return;

    try {
      await sendFriendRequest({
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email || "Anonymous",
        senderAvatar: currentUser.photoURL || undefined,
        recipientId: student.uid,
        recipientName: student.displayName || student.email || "Unknown",
        recipientAvatar: student.profilePic || student.photoURL || undefined,
      });
      toast({
        title: "Friend request sent!",
        description: `You've sent a friend request to ${student.displayName || student.email || "this user"}`,
      });
    } catch (error: any) {
      console.error("sendFriendRequest failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />

      <div className="lg:ml-64 flex-1">
        <Header />

        <main className="mx-auto max-w-7xl p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Student Directory</h1>
            <p className="text-muted-foreground">
              Connect with students across campus
            </p>
          </div>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch} value={batch}>
                      {batch === "all" ? "All Batches" : `Batch ${batch}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                No students found matching your filters
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((student, index) => (
                <Card
                  key={student.uid}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="p-6 space-y-4"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-20 w-20 mb-3 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                        <AvatarImage
                          src={student.profilePic || student.photoURL || ""}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {student.displayName?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <h3 className="font-semibold text-lg">
                        {student.displayName}
                      </h3>

                      {student.department && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <BookOpen className="h-3 w-3" />
                          {student.department}
                        </div>
                      )}

                      {student.batch && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Batch {student.batch}
                        </div>
                      )}
                    </div>

                    {student.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 text-center">
                        {student.bio}
                      </p>
                    )}

                    {student.interests && student.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {student.interests.slice(0, 3).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {student.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{student.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border-t p-3">
                    <Button
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(student);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={!!selectedStudent}
        onOpenChange={() => setSelectedStudent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Student Profile</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                    <AvatarImage
                      src={selectedStudent.profilePic || selectedStudent.photoURL || ""}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                      {selectedStudent.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-2xl font-bold">
                      {selectedStudent.displayName}
                    </h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2 justify-center sm:justify-start">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{selectedStudent.email}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedStudent.department && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Department
                      </p>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <p className="font-semibold">
                          {selectedStudent.department}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedStudent.batch && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Batch
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="font-semibold">
                          {selectedStudent.batch}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedStudent.bio && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Bio
                    </p>
                    <p className="text-sm leading-relaxed">
                      {selectedStudent.bio}
                    </p>
                  </div>
                )}

                {selectedStudent.interests &&
                  selectedStudent.interests.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Interests
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.interests.map((interest, i) => (
                          <Badge key={i} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleConnect(selectedStudent);
                      setSelectedStudent(null);
                    }}
                  >
                    <UserPlus className="h-4 w-4" />
                    Send Connection Request
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
