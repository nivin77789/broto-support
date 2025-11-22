import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MessageSquare, Shield, Zap } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      const redirectPath = userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/student";
      navigate(redirectPath);
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Brototype Complaints
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Streamlined complaint management for students and administrators
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6"
            >
              Student Portal
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/staff/auth")}
              className="text-lg px-8 py-6"
            >
              Staff Portal
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => navigate("/admin/login")}
              className="text-lg px-8 py-6"
            >
              Admin Portal
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-16 animate-fade-in">
            Students & Staff: Sign up or sign in • Admins: Use dedicated portal
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-lg bg-gradient-card border shadow-md animate-fade-in hover:scale-105 transition-transform">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Submission</h3>
              <p className="text-muted-foreground">
                Submit complaints quickly with our intuitive interface
              </p>
            </div>

            <div className="p-6 rounded-lg bg-gradient-card border shadow-md animate-fade-in hover:scale-105 transition-transform">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Tracking</h3>
              <p className="text-muted-foreground">
                Track the status of your complaints in real-time
              </p>
            </div>

            <div className="p-6 rounded-lg bg-gradient-card border shadow-md animate-fade-in hover:scale-105 transition-transform">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
