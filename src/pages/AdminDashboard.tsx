import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Filter, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [updateStatus, setUpdateStatus] = useState<"Pending" | "In Review" | "Resolved">("Pending");
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    let filtered = complaints;
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    if (filterCategory !== "all") {
      filtered = filtered.filter(c => c.category === filterCategory);
    }
    
    setFilteredComplaints(filtered);
  }, [filterStatus, filterCategory, complaints]);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const studentIds = [...new Set(data?.map(c => c.student_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", studentIds);

      const profilesMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        profilesMap[p.id] = p.name;
      });

      setProfiles(profilesMap);
      setComplaints(data || []);
      setFilteredComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
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
      fetchComplaints();
    } catch (error) {
      toast.error("Failed to update complaint");
    }
  };

  const getStatusCount = (status: string) => {
    return complaints.filter(c => c.status === status).length;
  };

  const getCategoryCount = (category: string) => {
    return complaints.filter(c => c.category === category).length;
  };

  const stats = [
    { label: "Total", value: complaints.length, color: "bg-primary" },
    { label: "Pending", value: getStatusCount("Pending"), color: "bg-warning" },
    { label: "In Review", value: getStatusCount("In Review"), color: "bg-primary" },
    { label: "Resolved", value: getStatusCount("Resolved"), color: "bg-success" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all complaints</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 bg-gradient-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full ${stat.color}/10 flex items-center justify-center`}>
                  <TrendingUp className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Hostel">Hostel</SelectItem>
              <SelectItem value="Mentor">Mentor</SelectItem>
              <SelectItem value="Financial">Financial</SelectItem>
              <SelectItem value="Infrastructure">Infrastructure</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No complaints found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredComplaints.map((complaint) => (
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
        )}

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

export default AdminDashboard;
