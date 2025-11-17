import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Building2, Download, Star, AlertCircle, FileText, Clock } from "lucide-react";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ImagePreview } from "@/components/ImagePreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
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
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showAnonymousOnly, setShowAnonymousOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "In Review" | "Resolved">("All");
  const [urgencyFilter, setUrgencyFilter] = useState<"All" | "Low" | "Normal" | "High" | "Critical">("All");

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
    let filtered = complaints;
    
    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    
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
    
    return filtered;
  };

  const toggleStar = async (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const complaint = complaints.find(c => c.id === complaintId);
      const currentStarred = complaint?.starred || false;

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

  const getComplaintsByCategory = (category: string) => {
    return getFilteredComplaints().filter(c => c.category === category);
  };

  const downloadComplaints = (status: 'Pending' | 'Resolved') => {
    const filteredComplaints = complaints.filter(c => c.status === status);

    if (filteredComplaints.length === 0) {
      toast.error(`No ${status.toLowerCase()} complaints to download`);
      return;
    }

    const excelData = filteredComplaints.map(complaint => ({
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
    
    toast.success(`Downloaded ${filteredComplaints.length} ${status.toLowerCase()} complaints`);
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadComplaints('Pending')}
              >
                <Download className="h-4 w-4 mr-2" />
                Pending
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadComplaints('Resolved')}
              >
                <Download className="h-4 w-4 mr-2" />
                Resolved
              </Button>
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

        {/* Filter Section */}
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
                <Badge variant="secondary" className="ml-1">
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
                      <Badge variant="secondary" className="ml-2">
                        {complaints.filter(c => c.urgency === "Low").length}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Normal">
                    <div className="flex items-center justify-between w-full">
                      <span>Normal</span>
                      <Badge variant="secondary" className="ml-2">
                        {complaints.filter(c => c.urgency === "Normal").length}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="flex items-center justify-between w-full">
                      <span>High</span>
                      <Badge variant="secondary" className="ml-2">
                        {complaints.filter(c => c.urgency === "High").length}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="Critical">
                    <div className="flex items-center justify-between w-full">
                      <span>Critical</span>
                      <Badge variant="secondary" className="ml-2">
                        {complaints.filter(c => c.urgency === "Critical").length}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {filteredComplaints.length}
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
              <Badge variant="secondary" className="ml-1">
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
              <Badge variant="secondary" className="ml-1">
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
              <Badge variant="secondary" className="ml-1">
                {complaints.filter(c => c.status === "Resolved").length}
              </Badge>
            </Button>
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
                       <Card 
                         key={complaint.id}
                         className="p-4 cursor-pointer transition-all hover:shadow-md bg-gradient-card border relative"
                         onClick={() => {
                           setSelectedComplaint(complaint);
                           setUpdateStatus(complaint.status);
                           setResolutionNote(complaint.resolution_note || "");
                         }}
                       >
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={(e) => toggleStar(complaint.id, e)}
                           className="absolute top-2 right-2 h-8 w-8"
                         >
                           <Star 
                             className={`h-4 w-4 ${complaint.starred ? "fill-warning text-warning" : "text-muted-foreground"}`} 
                           />
                         </Button>
                         <div className="flex items-start justify-between mb-3 pr-8">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <FileText className="h-4 w-4 text-primary" />
                               <h3 className="font-semibold text-lg">{complaint.title}</h3>
                             </div>
                             <p className="text-sm text-muted-foreground mb-2">
                               Student: {complaint.is_anonymous ? "Anonymous Student" : profiles[complaint.student_id] || "Unknown"}
                             </p>
                           </div>
                           <div className="flex flex-col gap-2 items-end">
                             {complaint.urgency && complaint.urgency !== "Normal" && (
                               <Badge
                                 className={
                                   complaint.urgency === "Critical"
                                     ? "bg-destructive/10 text-destructive border-destructive/50 animate-pulse gap-1"
                                     : complaint.urgency === "High"
                                     ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/50"
                                     : complaint.urgency === "Low"
                                     ? "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/50"
                                     : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/50"
                                 }
                                 variant="outline"
                               >
                                 {complaint.urgency === "Critical" && <AlertCircle className="h-3 w-3" />}
                                 {complaint.urgency}
                               </Badge>
                             )}
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
                           </div>
                         </div>
                         <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                           {complaint.description}
                         </p>
                         {complaint.attachment_url && (
                           <div className="mb-4">
                             <ImagePreview imageUrl={complaint.attachment_url} alt="Complaint attachment" />
                           </div>
                         )}
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                             <Clock className="h-3 w-3" />
                             <span>{format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
                           </div>
                           <Badge variant="outline" className="text-xs">
                             {complaint.category}
                           </Badge>
                         </div>
                       </Card>
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
