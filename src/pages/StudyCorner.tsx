import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/SupabaseConfig";
import {
  FileText,
  File,
  Presentation,
  Download,
  Upload,
  Search,
  BookOpen,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other",
];

const fileTypeIcons = {
  pdf: <FileText className="h-8 w-8 text-red-500" />,
  doc: <File className="h-8 w-8 text-blue-500" />,
  ppt: <Presentation className="h-8 w-8 text-orange-500" />,
  other: <File className="h-8 w-8 text-gray-500" />,
};

export default function StudyCorner() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadMaterials();
  }, [currentUser]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchQuery, filterSubject]);

  // 🔹 Fetch all materials from Supabase
  async function loadMaterials() {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMaterials(data || []);
    } catch (error) {
      console.error("Error loading materials:", error);
      toast({ title: "Error loading study materials", variant: "destructive" });
    } finally {
      setLoadingMaterials(false);
    }
  }

  // 🔹 Filter logic
  function filterMaterials() {
    let filtered = materials;
    if (filterSubject !== "all") {
      filtered = filtered.filter((m) => m.subject === filterSubject);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.subject?.toLowerCase().includes(q)
      );
    }
    setFilteredMaterials(filtered);
  }

  // 🔹 Detect file type
  function getFileType(filename: string) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (ext === "doc" || ext === "docx") return "doc";
    if (ext === "ppt" || ext === "pptx") return "ppt";
    return "other";
  }

  // 🔹 Upload to Supabase Storage + Database
  async function handleUpload() {
    if (!title.trim() || !description.trim() || !subject || !file) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    if (!currentUser) {
      toast({
        title: "You must be logged in to upload materials",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("study-materials")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("study-materials")
        .getPublicUrl(filePath);

      const fileUrl = publicUrlData?.publicUrl;

      const uploaderName =
        userProfile?.displayName ||
        currentUser?.displayName ||
        currentUser?.email?.split("@")[0] ||
        "Anonymous User";

      const { error: insertError } = await supabase
        .from("study_materials")
        .insert([
          {
            title,
            description,
            subject,
            file_url: fileUrl,
            file_type: getFileType(file.name),
            uploader_id: currentUser.uid,
            uploader_name: uploaderName,
          },
        ]);

      if (insertError) throw insertError;

      toast({ title: "✅ Study material uploaded successfully!" });
      setTitle("");
      setDescription("");
      setSubject("");
      setFile(null);
      setUploadDialogOpen(false);
      loadMaterials();
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error uploading file", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Download (increments downloads in DB)
  async function handleDownload(material: any) {
    try {
      await supabase
        .from("study_materials")
        .update({ downloads: (material.downloads || 0) + 1 })
        .eq("id", material.id);

      window.open(material.file_url, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      toast({ title: "Error downloading file", variant: "destructive" });
    }
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <MobileNav />
      <div className="lg:ml-64 flex-1 w-full">
        <Header />
        <main className="mx-auto w-full max-w-6xl p-3 sm:p-4 md:p-6 pb-24 sm:pb-20 lg:pb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Study Corner</h1>
            </div>
            <p className="text-muted-foreground">
              Share and access study materials, notes, and papers
            </p>
          </div>

          {/* Search & Upload */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Data Structures Notes"
                  />

                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the material"
                  />

                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label htmlFor="file">File (PDF, DOC, PPT)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {file.name}
                    </p>
                  )}

                  <Button onClick={handleUpload} disabled={loading} className="w-full">
                    {loading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Materials Grid */}
          {loadingMaterials ? (
            <p className="text-center text-muted-foreground py-12">
              Loading study materials...
            </p>
          ) : filteredMaterials.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterSubject !== "all"
                  ? "Try adjusting your search or filters"
                  : "Be the first to upload study materials!"}
              </p>
              <Button onClick={() => setUploadDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" /> Upload Material
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((m, index) => (
                <Card key={m.id} className="p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {fileTypeIcons[m.file_type] || fileTypeIcons.other}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1">{m.title}</h3>
                      <p className="text-xs text-muted-foreground">{m.subject}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {m.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>By {m.uploader_name}</span>
                    <span>{m.downloads || 0} downloads</span>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {m.created_at
                      ?  formatDistanceToNow(new Date(m.created_at + "Z"), {
        addSuffix: true,
      })
                      : "Just now"}
                  </p>

                  <Button className="w-full gap-2" size="sm" onClick={() => handleDownload(m)}>
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
