import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ComplaintChat } from "@/components/ComplaintChat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const categories = ["All", "Communication", "Hub", "Review", "Payments", "Others"];
const statuses = ["Pending", "In Review", "Resolved"];

const StaffComplaints = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [staffProfile, setStaffProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/staff/auth");
      return;
    }
    fetchStaffProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (staffProfile) {
      fetchComplaints();
    }
  }, [staffProfile]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, selectedCategory, selectedStatus]);

  const fetchStaffProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*, hubs(*)")
        .eq("user_id", user?.id)
        .eq("verified", true)
        .single();

      if (error) throw error;
      setStaffProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
      navigate("/staff");
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          *,
          profiles:student_id (name, email, batch),
          hubs (name)
        `)
        .eq("hub_id", staffProfile.hub_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter((c) => c.status === selectedStatus);
    }

    setFilteredComplaints(filtered);
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: "Pending" | "In Review" | "Resolved") => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ status: newStatus })
        .eq("id", complaintId);

      if (error) throw error;

      toast.success("Status updated successfully");
      fetchComplaints();
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus });
      }
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleAddResolution = async (complaintId: string, resolution: string) => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          resolution_note: resolution,
          status: "Resolved"
        })
        .eq("id", complaintId);

      if (error) throw error;

      toast.success("Resolution added successfully");
      fetchComplaints();
      setDetailsOpen(false);
    } catch (error: any) {
      toast.error("Failed to add resolution");
    }
  };

  const handleCardClick = (complaint: any) => {
    setSelectedComplaint(complaint);
    setDetailsOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "In Review":
        return <AlertCircle className="h-4 w-4" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusCounts = () => {
    return {
      pending: complaints.filter((c) => c.status === "Pending").length,
      inReview: complaints.filter((c) => c.status === "In Review").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/staff")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Manage Complaints - {staffProfile?.hubs?.name}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{statusCounts.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Review</p>
                <p className="text-3xl font-bold">{statusCounts.inReview}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-3xl font-bold">{statusCounts.resolved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Complaints List */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">
            Complaints ({filteredComplaints.length})
          </h2>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No complaints found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onClick={() => handleCardClick(complaint)}
                />
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Complaint Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint Details</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedComplaint.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                  <Badge
                    variant={
                      selectedComplaint.status === "Resolved"
                        ? "default"
                        : selectedComplaint.status === "In Review"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {getStatusIcon(selectedComplaint.status)}
                    <span className="ml-1">{selectedComplaint.status}</span>
                  </Badge>
                  <Badge variant="outline">{selectedComplaint.urgency}</Badge>
                </div>
                <p className="text-muted-foreground mb-4">{selectedComplaint.description}</p>

                {!selectedComplaint.is_anonymous && (
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm">
                      <span className="font-semibold">Student:</span>{" "}
                      {selectedComplaint.profiles?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedComplaint.profiles?.email}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Update Status</Label>
                <Select
                  value={selectedComplaint.status}
                  onValueChange={(value) => handleUpdateStatus(selectedComplaint.id, value as "Pending" | "In Review" | "Resolved")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedComplaint.status !== "Resolved" && (
                <div>
                  <Label>Add Resolution</Label>
                  <Textarea
                    placeholder="Describe how this complaint was resolved..."
                    id="resolution"
                    className="mb-2"
                  />
                  <Button
                    onClick={() => {
                      const textarea = document.getElementById("resolution") as HTMLTextAreaElement;
                      if (textarea.value.trim()) {
                        handleAddResolution(selectedComplaint.id, textarea.value.trim());
                      } else {
                        toast.error("Please enter a resolution note");
                      }
                    }}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}

              {selectedComplaint.resolution_note && (
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <p className="text-sm font-semibold mb-1">Resolution:</p>
                  <p className="text-sm">{selectedComplaint.resolution_note}</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setChatOpen(true);
                  setDetailsOpen(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Open Chat
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <ComplaintChat
              complaintId={selectedComplaint.id}
              currentUserId={user?.id || ""}
              currentUserName={staffProfile?.name || "Staff"}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffComplaints;
