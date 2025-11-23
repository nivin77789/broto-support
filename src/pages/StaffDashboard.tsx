import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, User, Building2, Mail, Phone, FileText, Clock, AlertCircle, CheckCircle, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ComplaintCard } from "@/components/ComplaintCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [hub, setHub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    resolved: 0,
  });
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const categories = ["All", "Communication", "Hub", "Review", "Payments", "Others"];
  const statuses = ["All", "Pending", "In Review", "Resolved"];

  useEffect(() => {
    if (!user) {
      navigate("/staff/auth");
      return;
    }
    fetchStaffProfile();
  }, [user, navigate]);

  const fetchStaffProfile = async () => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select("*, hubs(*)")
        .eq("user_id", user?.id)
        .single();

      if (staffError) throw staffError;

      if (!staffData.verified) {
        navigate("/staff/pending");
        return;
      }

      setStaffProfile(staffData);
      setHub(staffData.hubs);
      
      // Fetch complaints
      const { data: complaintsData, error: complaintsError } = await supabase
        .from("complaints")
        .select(`
          *,
          profiles:student_id (name, email, batch),
          hubs (name)
        `)
        .eq("hub_id", staffData.hub_id)
        .order("created_at", { ascending: false });

      if (!complaintsError && complaintsData) {
        setComplaints(complaintsData);
        setComplaintStats({
          total: complaintsData.length,
          pending: complaintsData.filter((c) => c.status === "Pending").length,
          inReview: complaintsData.filter((c) => c.status === "In Review").length,
          resolved: complaintsData.filter((c) => c.status === "Resolved").length,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredComplaints = complaints.filter((complaint) => {
    const categoryMatch = selectedCategory === "All" || complaint.category === selectedCategory;
    const statusMatch = selectedStatus === "All" || complaint.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

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
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Staff Portal
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Complaint Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Complaints</p>
                  <p className="text-3xl font-bold">{complaintStats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{complaintStats.pending}</p>
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
                  <p className="text-3xl font-bold">{complaintStats.inReview}</p>
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
                  <p className="text-3xl font-bold">{complaintStats.resolved}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/staff/complaints")}
                className="h-auto py-6 flex-col gap-2"
              >
                <FileText className="h-6 w-6" />
                <span>View & Manage Complaints</span>
              </Button>
            </div>
          </Card>

          {/* Complaints Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Complaints for {hub?.name}</h2>
              <Button onClick={() => navigate("/staff/complaints")} variant="outline">
                View All
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
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

            {/* Complaints Grid */}
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No complaints found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComplaints.slice(0, 6).map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    complaint={complaint}
                    onClick={() => navigate("/staff/complaints")}
                  />
                ))}
              </div>
            )}
            
            {filteredComplaints.length > 6 && (
              <div className="mt-4 text-center">
                <Button onClick={() => navigate("/staff/complaints")} variant="link">
                  View {filteredComplaints.length - 6} more complaints
                </Button>
              </div>
            )}
          </Card>

          {/* Profile Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{staffProfile?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{staffProfile?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{staffProfile?.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium">{staffProfile?.role_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Hub</p>
                  <p className="font-medium">{hub?.name}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
