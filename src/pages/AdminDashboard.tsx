import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Filter, TrendingUp, Building2, Plus, ArrowRight, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComplaintCard } from "@/components/ComplaintCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState<"Pending" | "In Review" | "Resolved">("Pending");
  const [resolutionNote, setResolutionNote] = useState("");
  const [hubDialogOpen, setHubDialogOpen] = useState(false);
  const [newHub, setNewHub] = useState({ name: "", location: "" });

  useEffect(() => {
    fetchHubs();
    fetchComplaints();
  }, []);

  const fetchHubs = useCallback(async () => {
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
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, profiles!complaints_student_id_fkey(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const profilesMap: Record<string, string> = {};
      data?.forEach((c: any) => {
        if (c.profiles?.name) {
          profilesMap[c.student_id] = c.profiles.name;
        }
      });

      setProfiles(profilesMap);
      setComplaints(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  }, []);

  const categories = useMemo(() => ["Communication", "Hub", "Review", "Payments", "Others"], []);

  const hubStats = useMemo(() => {
    const stats = new Map();
    hubs.forEach(hub => {
      const hubComplaints = complaints.filter(c => c.hub_id === hub.id);
      stats.set(hub.id, {
        total: hubComplaints.length,
        pending: hubComplaints.filter(c => c.status === "Pending").length,
        resolved: hubComplaints.filter(c => c.status === "Resolved").length,
      });
    });
    return stats;
  }, [complaints, hubs]);

  const complaintStats = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter(c => c.status === "Pending").length,
    inReview: complaints.filter(c => c.status === "In Review").length,
    resolved: complaints.filter(c => c.status === "Resolved").length,
  }), [complaints]);

  const newComplaints = useMemo(() => 
    complaints
      .filter(c => c.status === "Pending")
      .slice(0, 10)
  , [complaints]);

  const handleAddHub = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHub.name.trim()) {
      toast.error("Hub name is required");
      return;
    }

    try {
      const { error } = await supabase.from("hubs").insert({
        name: newHub.name.trim(),
        location: newHub.location.trim() || null,
      });

      if (error) throw error;

      toast.success("Hub added successfully!");
      setHubDialogOpen(false);
      setNewHub({ name: "", location: "" });
      fetchHubs();
    } catch (error: any) {
      toast.error(error.message || "Failed to add hub");
    }
  }, [newHub, fetchHubs]);

  const handleUpdateComplaint = useCallback(async () => {
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
  }, [selectedComplaint, updateStatus, resolutionNote, fetchComplaints]);

  const downloadHubComplaints = useCallback((hubId: string, status: 'Pending' | 'Resolved', e: React.MouseEvent) => {
    e.stopPropagation();
    
    const hubComplaints = complaints.filter(c => 
      c.hub_id === hubId && c.status === status
    );

    if (hubComplaints.length === 0) {
      toast.error(`No ${status.toLowerCase()} complaints to download`);
      return;
    }

    const hub = hubs.find(h => h.id === hubId);
    const excelData = hubComplaints.map(complaint => ({
      'Title': complaint.title,
      'Category': complaint.category,
      'Status': complaint.status,
      'Student': profiles[complaint.student_id] || 'Unknown',
      'Description': complaint.description,
      'Resolution Note': complaint.resolution_note || 'N/A',
      'Created At': new Date(complaint.created_at).toLocaleString(),
      'Has Attachment': complaint.attachment_url ? 'Yes' : 'No',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${status} Complaints`);
    
    const fileName = `${hub?.name || 'Hub'}_${status}_Complaints_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast.success(`Downloaded ${hubComplaints.length} ${status.toLowerCase()} complaints`);
  }, [complaints, hubs, profiles]);

  const stats = useMemo(() => [
    { label: "Total", value: complaintStats.total, color: "bg-primary" },
    { label: "Pending", value: complaintStats.pending, color: "bg-warning" },
    { label: "In Review", value: complaintStats.inReview, color: "bg-primary" },
    { label: "Resolved", value: complaintStats.resolved, color: "bg-success" },
  ], [complaintStats]);

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
            <Dialog open={hubDialogOpen} onOpenChange={setHubDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Hubs
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Hub</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddHub} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hubName">Hub Name *</Label>
                    <Input
                      id="hubName"
                      value={newHub.name}
                      onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                      placeholder="e.g., Kochi Hub"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hubLocation">Location</Label>
                    <Input
                      id="hubLocation"
                      value={newHub.location}
                      onChange={(e) => setNewHub({ ...newHub, location: e.target.value })}
                      placeholder="e.g., Infopark, Kochi"
                      maxLength={200}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Hub
                  </Button>
                </form>
                <div className="mt-4">
                  <Label>Existing Hubs</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {hubs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hubs yet</p>
                    ) : (
                      hubs.map((hub) => (
                        <div key={hub.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{hub.name}</p>
                            {hub.location && <p className="text-xs text-muted-foreground">{hub.location}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Side - Hub Cards */}
            <div className="col-span-12 lg:col-span-4 space-y-3">
              <h2 className="text-lg font-bold mb-3">Hubs</h2>
              {hubs.map((hub) => {
                const stats = hubStats.get(hub.id) || { total: 0, pending: 0, resolved: 0 };
                
                return (
                  <Card 
                    key={hub.id} 
                    className="p-4 bg-gradient-card cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => navigate(`/admin/hub/${hub.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-bold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          {hub.name}
                        </h3>
                        {hub.location && (
                          <p className="text-xs text-muted-foreground mt-0.5">{hub.location}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="flex gap-3 mb-3">
                      <div className="text-center">
                        <p className="text-xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-warning">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-success">{stats.resolved}</p>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                      </div>
                    </div>
                    <div className="flex gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => downloadHubComplaints(hub.id, 'Pending', e)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Pending
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={(e) => downloadHubComplaints(hub.id, 'Resolved', e)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Resolved
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Right Side - New Complaints */}
            <div className="col-span-12 lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Recent Pending Complaints</h2>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {newComplaints.length} New
                </Badge>
              </div>

              {newComplaints.length === 0 ? (
                <Card className="p-12 bg-gradient-card">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending complaints</p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {newComplaints.map((complaint) => (
                    <Card 
                      key={complaint.id}
                      className="p-4 bg-gradient-card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{complaint.title}</h3>
                            <Badge variant="outline">{complaint.category}</Badge>
                            <Badge variant="secondary">Pending</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {complaint.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Student: {profiles[complaint.student_id]}</span>
                            <span>•</span>
                            <span>Hub: {hubs.find(h => h.id === complaint.hub_id)?.name || "N/A"}</span>
                            <span>•</span>
                            <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setUpdateStatus(complaint.status);
                            setResolutionNote(complaint.resolution_note || "");
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
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
                  <Label>Hub</Label>
                  <p className="mt-2 text-sm font-medium">
                    {selectedComplaint.hub_id 
                      ? hubs.find(h => h.id === selectedComplaint.hub_id)?.name 
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="mt-2 text-sm">{selectedComplaint.description}</p>
                </div>

                {selectedComplaint.attachment_url && (
                  <div>
                    <Label>Attachment</Label>
                    <img 
                      src={selectedComplaint.attachment_url} 
                      alt="Complaint attachment" 
                      className="mt-2 w-full max-h-96 object-contain rounded-lg border"
                    />
                  </div>
                )}

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
