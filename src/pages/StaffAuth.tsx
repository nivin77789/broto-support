import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

const staffSignupSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  role_name: z.string().trim().min(2, "Role is required").max(100, "Role too long"),
  hub_id: z.string().min(1, "Hub selection is required"),
});

const StaffAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleName, setRoleName] = useState("");
  const [hubId, setHubId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/staff");
    }
    fetchHubs();
  }, [user, navigate]);

  const fetchHubs = async () => {
    const { data } = await supabase.from("hubs").select("*").order("name");
    setHubs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = staffSignupSchema.parse({
        email,
        password,
        name,
        phone,
        role_name: roleName,
        hub_id: hubId,
      });

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("This email is already registered.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account");
        return;
      }

      // Insert staff record
      const { error: staffError } = await supabase.from("staff").insert({
        user_id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        phone: validatedData.phone,
        role_name: validatedData.role_name,
        hub_id: validatedData.hub_id,
        verified: false,
      });

      if (staffError) {
        toast.error("Failed to create staff profile");
        return;
      }

      toast.success("Staff signup successful! Waiting for admin verification.");
      navigate("/staff/pending");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute top-4 left-4">
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <Card className="w-full max-w-md p-8 bg-gradient-card shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Staff Signup
          </h1>
          <p className="text-muted-foreground">
            Create your staff account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role/Position</Label>
            <Input
              id="role"
              type="text"
              placeholder="e.g., Hub Manager, Mentor"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hub">Hub</Label>
            <Select value={hubId} onValueChange={setHubId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select your hub" />
              </SelectTrigger>
              <SelectContent>
                {hubs.filter(hub => hub.id).map((hub) => (
                  <SelectItem key={hub.id} value={hub.id}>
                    {hub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up as Staff"}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your account will need to be verified by an admin before you can access the staff portal.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StaffAuth;
