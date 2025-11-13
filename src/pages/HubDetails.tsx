import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Building2 } from "lucide-react";
import { ComplaintCard } from "@/components/ComplaintCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const HubDetails = () => {
  const { hubId } = useParams();
  const navigate = useNavigate();
  const [hub, setHub] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<"Pending" | "In Review" | "Resolved">("Pending");
  const [resolutionNote, setResolutionNote] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = ["Communication", "Hub", "Review", "Payments", "Others"];

  useEffect(() => {
    fetchHubDetails();
  }, [hubId]);

  const fetchHubDetails = async () => {
    try {
      // Fetch hub info
      const { data: hubData, error: hubError } = await supabase
        .from("hubs")
        .select("*")
        .eq("id", hubId)
        .single();

      if (hubError) throw hubError;
      setHub(hubData);

      // Fetch complaints for this hub
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("complaints")
        .select("*")
        .eq("hub_id", hubId)
        .order("created_at", { ascending: false });

      if (complaintsError) throw complaintsError;

      // Fetch student profiles
      const studentIds = [...new Set(complaintsData?.map(c => c.student_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", studentIds);

      const profilesMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        profilesMap[p.id] = p.name;
      });

      setProfiles(profilesMap);
      setComplaints(complaintsData || []);
    } catch (error: any) {
      toast.error("Failed to fetch hub details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !updateStatus) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: updateStatus,
          resolution_note: resolutionNote || null,
        })
        .eq("id", selectedComplaint.id);

      if (error) throw error;

      toast.success("Complaint updated successfully!");
      setSelectedComplaint(null);
      setUpdateStatus("Pending");
      setResolutionNote("");
      fetchHubDetails();
    } catch (error) {
      toast.error("Failed to update complaint");
    }
  };

  const getFilteredComplaints = () => {
    if (categoryFilter === "all") return complaints;
    return complaints.filter(c => c.category === categoryFilter);
  };

  const getComplaintsByCategory = (category: string) => {
    return getFilteredComplaints().filter(c => c.category === category);
  };

  const getStats = () => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === "Pending").length,
      inReview: complaints.filter(c => c.status === "In Review").length,
      resolved: complaints.filter(c => c.status === "Resolved").length,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Hub not found</p>
          <Button onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const filteredComplaints = getFilteredComplaints();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {hub.name}
              </h1>
              {hub.location && (
                <p className="text-sm text-muted-foreground mt-1">{hub.location}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="p-6 bg-gradient-card">
            <p className="text-sm text-muted-foreground">Total Complaints</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </Card>
          <Card className="p-6 bg-gradient-card">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold mt-1 text-warning">{stats.pending}</p>
          </Card>
          <Card className="p-6 bg-gradient-card">
            <p className="text-sm text-muted-foreground">In Review</p>
            <p className="text-3xl font-bold mt-1 text-primary">{stats.inReview}</p>
          </Card>
          <Card className="p-6 bg-gradient-card">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-3xl font-bold mt-1 text-success">{stats.resolved}</p>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Complaints</h2>
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" />
              Category:
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <Card className="p-12 bg-gradient-card">
            <div className="text-center text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No complaints found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryComplaints = getComplaintsByCategory(category);
              if (categoryComplaints.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <h3 className="text-lg font-semibold">{category}</h3>
                    <Badge variant="outline">{categoryComplaints.length}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryComplaints.map((complaint) => (
                      <ComplaintCard
                        key={complaint.id}
                        complaint={complaint}
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setUpdateStatus(complaint.status);
                          setResolutionNote(complaint.resolution_note || "");
                        }}
                        showStudent
                        studentName={profiles[complaint.student_id]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Update Complaint Dialog */}
        <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedComplaint?.title}</DialogTitle>
            </DialogHeader>
            {selectedComplaint && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                  <Badge variant="outline">{selectedComplaint.status}</Badge>
                </div>
                <div>
                  <Label>Student</Label>
                  <p className="mt-2 text-sm font-medium">
                    {profiles[selectedComplaint.student_id]}
                  </p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="mt-2 text-sm">{selectedComplaint.description}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select
                    value={updateStatus}
                    onValueChange={(value) => setUpdateStatus(value as "Pending" | "In Review" | "Resolved")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Review">In Review</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution Note</Label>
                  <Textarea
                    id="resolution"
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Add resolution details (optional)"
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <Button
                  onClick={handleUpdateComplaint}
                  className="w-full bg-gradient-primary"
                >
                  Update Complaint
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default HubDetails;
