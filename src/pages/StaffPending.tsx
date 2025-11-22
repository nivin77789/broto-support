import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const StaffPending = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/staff/auth");
      return;
    }

    // Check verification status
    const checkVerification = async () => {
      const { data } = await supabase
        .from("staff")
        .select("verified")
        .eq("user_id", user.id)
        .single();

      if (data?.verified) {
        navigate("/staff");
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md p-8 text-center bg-gradient-card shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Pending Verification</h1>
        <p className="text-muted-foreground mb-6">
          Your staff account is awaiting admin approval. You'll be able to access the staff portal once verified.
        </p>
        
        <div className="p-4 bg-muted/50 rounded-lg border border-border mb-6">
          <p className="text-sm text-muted-foreground">
            This page will automatically redirect once your account is verified.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </Card>
    </div>
  );
};

export default StaffPending;
