import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { z } from "zod";

const adminLoginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(1, "Password is required"),
});

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole === "admin") {
      navigate("/admin");
    } else if (user && userRole === "student") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/student");
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = adminLoginSchema.parse({
        email,
        password,
      });

      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        toast.error("Invalid credentials or insufficient permissions");
      } else {
        // Wait a moment for role to be fetched
        setTimeout(() => {
          toast.success("Admin access granted!");
        }, 500);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-destructive/5">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card className="w-full max-w-md p-8 bg-gradient-card shadow-lg border-destructive/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Admin Portal</h1>
          <p className="text-muted-foreground">
            Restricted access - Admin credentials required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@brototype.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="border-destructive/20 focus:border-destructive"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-destructive/20 focus:border-destructive"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Admin Sign In"}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm font-semibold text-center mb-2">Demo Admin Credentials</p>
            <div className="space-y-1 text-sm">
              <p className="text-center"><span className="font-medium">Email:</span> nivin77789@gmail.com</p>
              <p className="text-center"><span className="font-medium">Password:</span> Nivin77789@</p>
            </div>
          </div>
          
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-xs text-center text-muted-foreground">
              This portal is restricted to authorized administrators only.
              Unauthorized access attempts are logged.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminLogin;
