import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long").optional(),
  batch: z.string().trim().min(1, "Batch is required").optional(),
  hub_id: z.string().min(1, "Hub selection is required").optional(),
  course_id: z.string().min(1, "Course selection is required").optional(),
});

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("");
  const [hubId, setHubId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [hubs, setHubs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const { signUp, signIn, user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSignUp) {
      fetchHubs();
      fetchCourses();
    }
  }, [isSignUp]);

  const fetchHubs = async () => {
    const { data } = await supabase.from("hubs").select("*").order("name");
    setHubs(data || []);
  };

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("*").order("name");
    setCourses(data || []);
  };

  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === "admin" ? "/admin" : "/student");
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({
        email,
        password,
        name: isSignUp ? name : undefined,
        batch: isSignUp ? batch : undefined,
        hub_id: isSignUp ? hubId : undefined,
        course_id: isSignUp ? courseId : undefined,
      });

      const { error } = isSignUp
        ? await signUp(
            validatedData.email,
            validatedData.password,
            validatedData.name || "",
            validatedData.batch || "",
            validatedData.hub_id || "",
            validatedData.course_id || ""
          )
        : await signIn(validatedData.email, validatedData.password);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message || "Authentication failed");
        }
      } else {
        toast.success(isSignUp ? "Account created successfully!" : "Signed in successfully!");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
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
      
      <Card className="w-full max-w-md p-8 bg-gradient-card shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Brototype Complaints
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
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
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  type="text"
                  placeholder="e.g., Batch 45"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hub">Hub</Label>
                <Select value={hubId} onValueChange={setHubId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubs.map((hub) => (
                      <SelectItem key={hub.id} value={hub.id}>
                        {hub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Domain/Course</Label>
                <Select value={courseId} onValueChange={setCourseId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
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
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        {!isSignUp && (
          <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-semibold text-center mb-2">Demo Student Credentials</p>
            <div className="space-y-1 text-sm">
              <p className="text-center"><span className="font-medium">Email:</span> varun@gmail.com</p>
              <p className="text-center"><span className="font-medium">Password:</span> Varun77789@</p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {isSignUp && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                New users are registered as students by default. Contact an admin to change your role.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Auth;
