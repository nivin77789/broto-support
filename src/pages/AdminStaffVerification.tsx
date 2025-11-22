import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminStaffVerification = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [verifiedStaff, setVerifiedStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*, hubs(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingStaff(data?.filter(s => !s.verified) || []);
      setVerifiedStaff(data?.filter(s => s.verified) || []);
    } catch (error: any) {
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("staff")
        .update({ verified: true })
        .eq("id", staffId);

      if (error) throw error;

      // Add staff role to user_roles
      const staff = pendingStaff.find(s => s.id === staffId);
      if (staff?.user_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: staff.user_id, role: "staff" });

        if (roleError) throw roleError;
      }

      toast.success("Staff approved successfully!");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to approve staff");
    }
  };

  const handleReject = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from("staff")
        .delete()
        .eq("id", staffId);

      if (error) throw error;

      toast.success("Staff application rejected");
      fetchStaff();
    } catch (error) {
      toast.error("Failed to reject staff");
    }
  };

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
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              Dashboard
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Staff Management
          </h1>
          <p className="text-muted-foreground mt-2">Approve or reject staff applications</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pending Verifications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Pending Verifications</h2>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {pendingStaff.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-3 pr-4">
                  {pendingStaff.length === 0 ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">No pending staff verifications</p>
                    </Card>
                  ) : (
                    pendingStaff.map((staff) => (
                      <Card key={staff.id} className="p-4 bg-gradient-card">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{staff.name}</h3>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Role</p>
                              <p className="font-medium">{staff.role_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hub</p>
                              <p className="font-medium">{staff.hubs?.name || "N/A"}</p>
                            </div>
                            {staff.phone && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{staff.phone}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(staff.id)}
                              className="flex-1"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(staff.id)}
                              className="flex-1"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Verified Staff */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Verified Staff</h2>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {verifiedStaff.length}
                </Badge>
              </div>
              
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="space-y-3 pr-4">
                  {verifiedStaff.length === 0 ? (
                    <Card className="p-6 text-center">
                      <p className="text-muted-foreground">No verified staff yet</p>
                    </Card>
                  ) : (
                    verifiedStaff.map((staff) => (
                      <Card key={staff.id} className="p-4 bg-gradient-card">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{staff.name}</h3>
                              <p className="text-sm text-muted-foreground">{staff.email}</p>
                            </div>
                            <Badge variant="outline" className="bg-success/10 text-success border-success">
                              Verified
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Role</p>
                              <p className="font-medium">{staff.role_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Hub</p>
                              <p className="font-medium">{staff.hubs?.name || "N/A"}</p>
                            </div>
                            {staff.phone && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Phone</p>
                                <p className="font-medium">{staff.phone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminStaffVerification;
