import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComplaintChat } from "@/components/ComplaintChat";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-warning/10 text-warning border-warning/20";
      case "In Review":
        return "bg-primary/10 text-primary border-primary/20";
      case "Resolved":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-gradient-card backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Admin Chat</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Complaints List */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="p-4 bg-gradient-card">
              <h2 className="text-lg font-semibold mb-4">Complaints</h2>
              <ScrollArea className="h-[calc(100vh-240px)]">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : complaints.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No complaints found
                  </p>
                ) : (
                  <div className="space-y-2">
                    {complaints.map((complaint) => (
                      <Card
                        key={complaint.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          selectedComplaint?.id === complaint.id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {complaint.title}
                            </h3>
                            <Badge
                              className={`${getStatusColor(complaint.status)} text-xs`}
                              variant="outline"
                            >
                              {complaint.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Student: {complaint.is_anonymous ? "Anonymous Student" : profiles[complaint.student_id] || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {complaint.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {complaint.category}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="col-span-12 lg:col-span-8">
            {selectedComplaint ? (
              <div className="space-y-4">
                <Card className="p-4 bg-gradient-card">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold">
                          {selectedComplaint.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Student: {selectedComplaint.is_anonymous ? "Anonymous Student" : profiles[selectedComplaint.student_id] || "Unknown"}
                        </p>
                      </div>
                      <Badge
                        className={getStatusColor(selectedComplaint.status)}
                        variant="outline"
                      >
                        {selectedComplaint.status}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm">{selectedComplaint.description}</p>
                    </div>
                    {selectedComplaint.attachment_url && (
                      <div className="pt-2">
                        <img
                          src={selectedComplaint.attachment_url}
                          alt="Complaint attachment"
                          className="w-full max-h-48 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {user && (
                  <ComplaintChat
                    complaintId={selectedComplaint.id}
                    currentUserId={user.id}
                    currentUserName="Admin"
                  />
                )}
              </div>
            ) : (
              <Card className="p-8 bg-gradient-card h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a complaint to start chatting
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminChat;
