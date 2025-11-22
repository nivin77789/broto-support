import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Filter, TrendingUp, Building2, Plus, ArrowRight, Download, MessageSquare, AlertCircle, Star, BarChart3, Settings, Mail, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComplaintCard } from "@/components/ComplaintCard";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminDashboard = () => {
  const { signOut, user } = useAuth();
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
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatComplaint, setChatComplaint] = useState<any>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "In Review" | "Resolved">("Pending");
  const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<"All" | "Low" | "Normal" | "High" | "Critical">("All");
  const [staff, setStaff] = useState<any[]>([]);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [forwardingComplaint, setForwardingComplaint] = useState<any>(null);

  useEffect(() => {
    fetchHubs();
    fetchComplaints();
    fetchStaff();
  }, []);

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

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*, hubs(name)")
        .order("name");

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch staff");
    }
  };

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
    } catch (error: any) {
      toast.error("Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const getComplaintsByHub = (hubId: string | null) => {
    return complaints.filter(c => c.hub_id === hubId);
  };

  const getComplaintsByCategory = (hubComplaints: any[], category: string) => {
    return hubComplaints.filter(c => c.category === category);
  };

  const categories = ["Communication", "Hub", "Review", "Payments", "Others"];


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

  const getHubStats = (hubId: string) => {
    const hubComplaints = getComplaintsByHub(hubId);
    return {
      total: hubComplaints.length,
      pending: hubComplaints.filter(c => c.status === "Pending").length,
      resolved: hubComplaints.filter(c => c.status === "Resolved").length,
    };
  };

  const getNewComplaints = () => {
    let filtered = complaints;
    
    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    // Filter by starred
    if (showStarredOnly) {
      filtered = filtered.filter(c => c.starred);
    }
    
    // Filter by anonymous
    if (showAnonymousOnly) {
      filtered = filtered.filter(c => c.is_anonymous);
    }
    
    // Filter by urgency
    if (urgencyFilter !== "All") {
      filtered = filtered.filter(c => c.urgency === urgencyFilter);
    }
    
    return filtered
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
  };

  const toggleStar = async (complaintId: string, currentStarred: boolean) => {
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ starred: !currentStarred })
        .eq("id", complaintId);

      if (error) throw error;

      // Update local state
      setComplaints(complaints.map(c => 
        c.id === complaintId ? { ...c, starred: !currentStarred } : c
      ));

      toast.success(currentStarred ? "Removed from starred" : "Added to starred");
    } catch (error) {
      toast.error("Failed to update star status");
    }
  };

  const downloadHubComplaints = (hubId: string, status: 'Pending' | 'Resolved', e: React.MouseEvent) => {
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
      <div className="flex items-center gap-3">
            <div className="bg-white/[0.10] p-2 rounded-lg">
              <img src="/logo.png" alt="Logo" className="h-auto w-auto max-h-12" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/analytics")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/chat")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Chats
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/staff")}>
              <Users className="h-4 w-4 mr-2" />
              Staffs
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-3 md:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 bg-gradient-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full ${stat.color}/10 flex items-center justify-center`}>
                  <TrendingUp className={`h-5 w-5 ${stat.color.replace('bg-', 'text-')}`} />
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
            <div className="col-span-12 lg:col-span-3 space-y-3">
              <h2 className="text-lg font-bold mb-3">Hubs</h2>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-3 pr-4">
                  {hubs.map((hub) => {
                    const stats = getHubStats(hub.id);
                    
                    return (
                      <Card 
                        key={hub.id} 
                        className="p-3 bg-gradient-card cursor-pointer hover:shadow-lg transition-all group"
                        onClick={() => navigate(`/admin/hub/${hub.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-bold flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                              {hub.name}
                            </h3>
                            {hub.location && (
                              <p className="text-xs text-muted-foreground mt-0.5">{hub.location}</p>
                            )}
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="flex gap-2">
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-warning">{stats.pending}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                          </div>
                          <div className="text-center flex-1">
                            <p className="text-lg font-bold text-success">{stats.resolved}</p>
                            <p className="text-xs text-muted-foreground">Resolved</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Right Side - Complaints */}
            <div className="col-span-12 lg:col-span-9">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold">Complaints</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={showStarredOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowStarredOnly(!showStarredOnly)}
                      className="gap-2"
                    >
                      <Star className={`h-4 w-4 ${showStarredOnly ? "fill-current" : ""}`} />
                      {showStarredOnly ? "Show All" : "Starred"}
                    </Button>
                    
                    <div className="h-6 w-px bg-border" />
                    
                    <Button
                      variant={showAnonymousOnly ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowAnonymousOnly(!showAnonymousOnly)}
                      className="gap-2"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      Anonymous
                      <Badge variant="outline" className="ml-1 bg-muted text-foreground">
                        {complaints.filter(c => c.is_anonymous).length}
                      </Badge>
                    </Button>
                    
                    <Select value={urgencyFilter} onValueChange={(value: any) => setUrgencyFilter(value)}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="All">All Urgency</SelectItem>
                        <SelectItem value="Low">
                          <div className="flex items-center justify-between w-full">
                            <span>Low</span>
                            <Badge variant="outline" className="ml-2 bg-muted text-foreground">
                              {complaints.filter(c => c.urgency === "Low").length}
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="Normal">
                          <div className="flex items-center justify-between w-full">
                            <span>Normal</span>
                            <Badge variant="outline" className="ml-2 bg-muted text-foreground">
                              {complaints.filter(c => c.urgency === "Normal").length}
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="High">
                          <div className="flex items-center justify-between w-full">
                            <span>High</span>
                            <Badge variant="outline" className="ml-2 bg-muted text-foreground">
                              {complaints.filter(c => c.urgency === "High").length}
                            </Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="Critical">
                          <div className="flex items-center justify-between w-full">
                            <span>Critical</span>
                            <Badge variant="outline" className="ml-2 bg-muted text-foreground">
                              {complaints.filter(c => c.urgency === "Critical").length}
                            </Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Badge variant="outline" className="text-lg px-4 py-2 bg-primary text-primary-foreground">
                      {getNewComplaints().length}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={statusFilter === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("All")}
                  >
                    All
                  </Button>
                    <Button
                      variant={statusFilter === "Pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("Pending")}
                      className="gap-2"
                    >
                      Pending
                      <Badge variant="outline" className="ml-1 bg-muted text-foreground">
                        {complaints.filter(c => c.status === "Pending").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "In Review" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("In Review")}
                      className="gap-2"
                    >
                      In Review
                      <Badge variant="outline" className="ml-1 bg-muted text-foreground">
                        {complaints.filter(c => c.status === "In Review").length}
                      </Badge>
                    </Button>
                    <Button
                      variant={statusFilter === "Resolved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("Resolved")}
                      className="gap-2"
                    >
                      Resolved
                      <Badge variant="outline" className="ml-1 bg-muted text-foreground">
                        {complaints.filter(c => c.status === "Resolved").length}
                      </Badge>
                    </Button>
                </div>
              </div>

              {getNewComplaints().length === 0 ? (
                <Card className="p-12 bg-gradient-card">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>
                      {showStarredOnly 
                        ? "No starred complaints match the filters" 
                        : showAnonymousOnly
                        ? "No anonymous complaints match the filters"
                        : urgencyFilter !== "All"
                        ? `No ${urgencyFilter.toLowerCase()} urgency complaints match the filters`
                        : statusFilter === "All"
                        ? "No complaints yet"
                        : `No ${statusFilter.toLowerCase()} complaints`}
                    </p>
                  </div>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-380px)]">
                  <div className="space-y-4 pr-4">
                    {getNewComplaints().map((complaint) => (
                      <Card 
                        key={complaint.id}
                        className="p-4 bg-gradient-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(complaint.id, complaint.starred);
                            }}
                            className="shrink-0"
                          >
                            <Star 
                              className={`h-5 w-5 ${complaint.starred ? "fill-warning text-warning" : "text-muted-foreground"}`} 
                            />
                          </Button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold">{complaint.title}</h3>
                              <Badge variant="outline">{complaint.category}</Badge>
                              <Badge 
                                variant="outline"
                                className={
                                  complaint.status === "Pending"
                                    ? "bg-warning/10 text-warning border-warning/20"
                                    : complaint.status === "In Review"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-success/10 text-success border-success/20"
                                }
                              >
                                {complaint.status}
                              </Badge>
                              {complaint.urgency && complaint.urgency !== "Normal" && (
                                <Badge
                                  variant="outline"
                                  className={
                                    complaint.urgency === "Critical"
                                      ? "bg-destructive/10 text-destructive border-destructive/50 animate-pulse gap-1"
                                      : complaint.urgency === "High"
                                      ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/50"
                                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/50"
                                  }
                                >
                                  {complaint.urgency === "Critical" && <AlertCircle className="h-3 w-3" />}
                                  {complaint.urgency}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {complaint.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                Student: {complaint.is_anonymous ? (
                                  <>
                                    Anonymous
                                    <Badge variant="outline" className="ml-1 text-xs bg-muted text-foreground">
                                      {complaints.filter(c => c.is_anonymous).length}
                                    </Badge>
                                  </>
                                ) : (
                                  profiles[complaint.student_id] || "Unknown"
                                )}
                              </span>
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
                </ScrollArea>
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
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{selectedComplaint.category}</Badge>
                  <Badge variant="outline">{selectedComplaint.status}</Badge>
                  {selectedComplaint.urgency && selectedComplaint.urgency !== "Normal" && (
                    <Badge
                      variant="outline"
                      className={
                        selectedComplaint.urgency === "Critical"
                          ? "bg-destructive/10 text-destructive border-destructive/50 animate-pulse gap-1"
                          : selectedComplaint.urgency === "High"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/50"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/50"
                      }
                    >
                      {selectedComplaint.urgency === "Critical" && <AlertCircle className="h-3 w-3" />}
                      {selectedComplaint.urgency}
                    </Badge>
                  )}
                </div>
                <div>
                  <Label>Student</Label>
                  <p className="mt-2 text-sm font-medium">
                    {selectedComplaint.is_anonymous ? "Anonymous Student" : profiles[selectedComplaint.student_id] || "Unknown"}
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
                    <div className="mt-2">
                      <ImagePreview imageUrl={selectedComplaint.attachment_url} alt="Complaint attachment" />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/admin/chat?complaint=${selectedComplaint.id}`)}
                    className="flex-1 bg-gradient-primary"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with Student
                  </Button>
                  <Button
                    onClick={() => {
                      setForwardingComplaint(selectedComplaint);
                      setForwardDialogOpen(true);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
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

        <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Forward Complaint</DialogTitle>
            </DialogHeader>
            {forwardingComplaint && (
              <div className="space-y-4">
                <div>
                  <Label>Complaint: {forwardingComplaint.title}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{forwardingComplaint.description}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffSelect">Select Staff Member</Label>
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-xs text-muted-foreground">{member.role_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={async () => {
                    if (!selectedStaffId) {
                      toast.error("Please select a staff member");
                      return;
                    }

                    const selectedStaff = staff.find(s => s.id === selectedStaffId);
                    if (!selectedStaff) return;

                    try {
                      const complaintUrl = `${window.location.origin}/admin`;
                      
                      const { error } = await supabase.functions.invoke("forward-complaint", {
                        body: {
                          staffEmail: selectedStaff.email,
                          staffName: selectedStaff.name,
                          complaintTitle: forwardingComplaint.title,
                          complaintDescription: forwardingComplaint.description,
                          complaintCategory: forwardingComplaint.category,
                          complaintStatus: forwardingComplaint.status,
                          complaintUrgency: forwardingComplaint.urgency || "Normal",
                          studentName: forwardingComplaint.is_anonymous 
                            ? "Anonymous Student" 
                            : profiles[forwardingComplaint.student_id] || "Unknown",
                          createdAt: forwardingComplaint.created_at,
                          complaintUrl,
                        },
                      });

                      if (error) throw error;

                      toast.success(`Complaint forwarded to ${selectedStaff.name}`);
                      setForwardDialogOpen(false);
                      setSelectedStaffId("");
                      setForwardingComplaint(null);
                    } catch (error: any) {
                      console.error("Forward error:", error);
                      toast.error("Failed to forward complaint");
                    }
                  }}
                  className="w-full"
                  disabled={!selectedStaffId}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
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
