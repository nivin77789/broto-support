import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Filter, Pencil, Trash2, Upload, X, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ComplaintChatbot } from "@/components/ComplaintChatbot";
import { ComplaintChat } from "@/components/ComplaintChat";
import { ImagePreview } from "@/components/ImagePreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const categories = ["Communication", "Hub", "Review", "Payments", "Others"];
const urgencyLevels = ["Low", "Normal", "High", "Critical"];

const complaintSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  category: z.enum(["Communication", "Hub", "Review", "Payments", "Others"]),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
});

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingComplaint, setEditingComplaint] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    hub_id: "",
    urgency: "Normal",
    is_anonymous: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchHubs();
    fetchComplaints();
  }, [user]);

  useEffect(() => {
    if (filterStatus === "all") {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter(c => c.status === filterStatus));
    }
  }, [filterStatus, complaints]);

  const fetchHubs = async () => {
    try {
      const { data, error } = await supabase
        .from("hubs")
        .select("*")
        .order("name");

      if (error) throw error;
      setHubs(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch hubs");
    }
  };

  const fetchComplaints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
      setFilteredComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = complaintSchema.parse(formData);

      let attachmentUrl = null;
      if (imageFile) {
        attachmentUrl = await uploadImage(imageFile);
        if (!attachmentUrl) {
          return;
        }
      }

      const { error } = await supabase.from("complaints").insert({
        student_id: user?.id,
        title: validatedData.title,
        category: validatedData.category,
        description: validatedData.description,
        attachment_url: attachmentUrl,
        hub_id: formData.hub_id || null,
        urgency: formData.urgency as "Low" | "Normal" | "High" | "Critical",
        is_anonymous: formData.is_anonymous,
      });

      if (error) throw error;

      toast.success("Complaint submitted successfully!");
      setOpen(false);
      setFormData({ title: "", category: "", description: "", hub_id: "", urgency: "Normal", is_anonymous: false });
      setImageFile(null);
      setImagePreview(null);
      fetchComplaints();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to submit complaint");
      }
    }
  };

  const getStatusCount = (status: string) => {
    return complaints.filter(c => c.status === status).length;
  };

  const handleEdit = (complaint: any) => {
    setEditingComplaint(complaint);
    setFormData({
      title: complaint.title,
      category: complaint.category,
      description: complaint.description,
      hub_id: complaint.hub_id || "",
      urgency: complaint.urgency || "Normal",
      is_anonymous: complaint.is_anonymous || false,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = complaintSchema.parse(formData);

      let attachmentUrl = editingComplaint?.attachment_url;
      if (imageFile) {
        attachmentUrl = await uploadImage(imageFile);
        if (!attachmentUrl && imageFile) {
          return;
        }
      }

      const { error } = await supabase
        .from("complaints")
        .update({
          title: validatedData.title,
          category: validatedData.category,
          description: validatedData.description,
          attachment_url: attachmentUrl,
          hub_id: formData.hub_id || null,
          urgency: formData.urgency as "Low" | "Normal" | "High" | "Critical",
        })
        .eq("id", editingComplaint.id);

      if (error) throw error;

      toast.success("Complaint updated successfully!");
      setEditOpen(false);
      setEditingComplaint(null);
      setFormData({ title: "", category: "", description: "", hub_id: "", urgency: "Normal", is_anonymous: false });
      setImageFile(null);
      setImagePreview(null);
      fetchComplaints();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to update complaint");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedComplaint) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success("Complaint deleted successfully!");
      setDeleteOpen(false);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (error) {
      toast.error("Failed to delete complaint");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-auto w-auto max-h-16" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Student Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your complaints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/student/chat")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({complaints.length})</SelectItem>
                <SelectItem value="Pending">Pending ({getStatusCount("Pending")})</SelectItem>
                <SelectItem value="In Review">In Review ({getStatusCount("In Review")})</SelectItem>
                <SelectItem value="Resolved">Resolved ({getStatusCount("Resolved")})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submit New Complaint</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the issue"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hub">Hub</Label>
                  <Select
                    value={formData.hub_id}
                    onValueChange={(value) => setFormData({ ...formData, hub_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hub (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {hubs.map((hub) => (
                        <SelectItem key={hub.id} value={hub.id}>
                          {hub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          <div className="flex items-center gap-2">
                            {level === "Critical" && <AlertCircle className="h-4 w-4 text-destructive" />}
                            {level}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Critical and High urgency complaints will be prioritized
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of your complaint"
                    rows={6}
                    required
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Attachment (Optional)</Label>
                  <div className="flex flex-col gap-3">
                    {imagePreview ? (
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload image</span>
                        <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                        <input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked as boolean })}
                  />
                  <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                    Submit anonymously (your identity will be hidden)
                  </Label>
                </div>

                <Button type="submit" className="w-full bg-gradient-primary">
                  Submit Complaint
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {filterStatus === "all" ? "No complaints yet" : `No ${filterStatus.toLowerCase()} complaints`}
            </p>
            {filterStatus === "all" && (
              <Button onClick={() => setOpen(true)} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Complaint
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={() => setSelectedComplaint(complaint)}
              />
            ))}
          </div>
        )}

        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                  <Badge variant="outline">{selectedComplaint.status}</Badge>
                  {selectedComplaint.urgency && selectedComplaint.urgency !== "Normal" && (
                    <Badge
                      variant="outline"
                      className={
                        selectedComplaint.urgency === "Critical"
                          ? "bg-destructive/10 text-destructive border-destructive/50 animate-pulse"
                          : selectedComplaint.urgency === "High"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/50"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/50"
                      }
                    >
                      {selectedComplaint.urgency === "Critical" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {selectedComplaint.urgency}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="mt-2 text-sm">{selectedComplaint.description}</p>
                </div>
                {selectedComplaint.attachment_url && (
                  <div>
                    <Label>Attachment</Label>
                    <div className="mt-2">
                      <ImagePreview imageUrl={selectedComplaint.attachment_url} alt="Complaint attachment" />
                    </div>
                  </div>
                )}
                {selectedComplaint.resolution_note && (
                  <div>
                    <Label>Resolution</Label>
                    <p className="mt-2 text-sm bg-success/10 p-3 rounded-lg border border-success/20">
                      {selectedComplaint.resolution_note}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => navigate(`/student/chat?complaint=${selectedComplaint.id}`)}
                  className="w-full bg-gradient-primary mb-4"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleEdit(selectedComplaint);
                      setSelectedComplaint(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hub">Hub</Label>
                <Select
                  value={formData.hub_id}
                  onValueChange={(value) => setFormData({ ...formData, hub_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hub (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((hub) => (
                      <SelectItem key={hub.id} value={hub.id}>
                        {hub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-urgency">Urgency Level</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        <div className="flex items-center gap-2">
                          {level === "Critical" && <AlertCircle className="h-4 w-4 text-destructive" />}
                          {level}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Critical and High urgency complaints will be prioritized
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your complaint"
                  rows={6}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-image">Attachment (Optional)</Label>
                <div className="flex flex-col gap-3">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/5 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                      <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
                      <input
                        id="edit-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-primary">
                Update Complaint
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your complaint.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <ComplaintChatbot />
    </div>
  );
};

export default StudentDashboard;
