import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ComplaintChat } from "@/components/ComplaintChat";
import { ImagePreview } from "@/components/ImagePreview";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const StudentChat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  useEffect(() => {
    const complaintId = searchParams.get("complaint");
    if (complaintId && complaints.length > 0) {
      const complaint = complaints.find(c => c.id === complaintId);
      if (complaint) {
        setSelectedComplaint(complaint);
      }
    }
  }, [searchParams, complaints]);

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
                onClick={() => navigate("/student")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">My Chats</h1>
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
              <h2 className="text-lg font-semibold mb-4">Your Complaints</h2>
              <ScrollArea className="h-[calc(100vh-240px)]">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      No complaints yet
                    </p>
                    <Button onClick={() => navigate("/student")} size="sm">
                      Create a Complaint
                    </Button>
                  </div>
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
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm line-clamp-1">
                                {complaint.title}
                              </h3>
                              {complaint.is_anonymous && (
                                <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                              )}
                            </div>
                            <Badge
                              className={`${getStatusColor(complaint.status)} text-xs`}
                              variant="outline"
                            >
                              {complaint.status}
                            </Badge>
                          </div>
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-bold">
                            {selectedComplaint.title}
                          </h2>
                          {selectedComplaint.is_anonymous && (
                            <Badge variant="secondary">Anonymous</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
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
                        <Badge
                          className={getStatusColor(selectedComplaint.status)}
                          variant="outline"
                        >
                          {selectedComplaint.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-sm">{selectedComplaint.description}</p>
                    </div>
                    {selectedComplaint.attachment_url && (
                      <div className="pt-2">
                        <ImagePreview imageUrl={selectedComplaint.attachment_url} alt="Complaint attachment" />
                      </div>
                    )}
                    {selectedComplaint.resolution_note && (
                      <div className="pt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Resolution:
                        </p>
                        <p className="text-sm bg-success/10 p-3 rounded-lg border border-success/20">
                          {selectedComplaint.resolution_note}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {user && (
                  <ComplaintChat
                    complaintId={selectedComplaint.id}
                    currentUserId={user.id}
                    currentUserName={user.email || "Student"}
                  />
                )}
              </div>
            ) : (
              <Card className="p-8 bg-gradient-card h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a complaint to view chat
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

export default StudentChat;
