import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, Palette, Lock, Building2, BookOpen, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const themes = [
  { name: "Default", primary: "262.1 83.3% 57.8%", secondary: "220 14.3% 95.9%" },
  { name: "Ocean Blue", primary: "210 100% 50%", secondary: "210 100% 95%" },
  { name: "Forest Green", primary: "142 71% 45%", secondary: "142 71% 95%" },
  { name: "Sunset Orange", primary: "24 95% 53%", secondary: "24 95% 95%" },
  { name: "Royal Purple", primary: "271 81% 56%", secondary: "271 81% 95%" },
  { name: "Rose Pink", primary: "330 81% 60%", secondary: "330 81% 95%" },
  { name: "Crimson Red", primary: "348 83% 47%", secondary: "348 83% 95%" },
  { name: "Amber Gold", primary: "43 96% 56%", secondary: "43 96% 95%" },
  { name: "Teal Cyan", primary: "173 80% 40%", secondary: "173 80% 95%" },
  { name: "Midnight Blue", primary: "222 47% 11%", secondary: "222 47% 95%" },
];

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hubs, setHubs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [newHub, setNewHub] = useState({ name: "", location: "" });
  const [newCourse, setNewCourse] = useState("");
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role_name: "", hub_id: "", phone: "" });
  const [editingHub, setEditingHub] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "hub" | "course" | "staff"; id: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Default");

  useEffect(() => {
    fetchHubs();
    fetchCourses();
    fetchStaff();
    loadTheme();
  }, []);

  const loadTheme = () => {
    const savedTheme = localStorage.getItem("admin-theme");
    if (savedTheme) {
      setSelectedTheme(savedTheme);
      applyTheme(savedTheme);
    }
  };

  const applyTheme = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName);
    if (theme) {
      document.documentElement.style.setProperty("--primary", theme.primary);
      document.documentElement.style.setProperty("--secondary", theme.secondary);
      localStorage.setItem("admin-theme", themeName);
      setSelectedTheme(themeName);
      toast.success(`Theme changed to ${themeName}`);
    }
  };

  const fetchHubs = async () => {
    const { data, error } = await supabase.from("hubs").select("*").order("name");
    if (error) {
      toast.error("Failed to fetch hubs");
    } else {
      setHubs(data || []);
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase.from("courses").select("*").order("name");
    if (error) {
      toast.error("Failed to fetch courses");
    } else {
      setCourses(data || []);
    }
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase.from("staff").select("*, hubs(name)").order("name");
    if (error) {
      toast.error("Failed to fetch staff");
    } else {
      setStaff(data || []);
    }
  };

  const handleAddHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHub.name.trim()) {
      toast.error("Hub name is required");
      return;
    }

    const { error } = await supabase.from("hubs").insert({
      name: newHub.name.trim(),
      location: newHub.location.trim() || null,
    });

    if (error) {
      toast.error("Failed to add hub");
    } else {
      toast.success("Hub added successfully");
      setNewHub({ name: "", location: "" });
      fetchHubs();
    }
  };

  const handleUpdateHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHub) return;

    const { error } = await supabase
      .from("hubs")
      .update({
        name: editingHub.name.trim(),
        location: editingHub.location?.trim() || null,
      })
      .eq("id", editingHub.id);

    if (error) {
      toast.error("Failed to update hub");
    } else {
      toast.success("Hub updated successfully");
      setEditingHub(null);
      fetchHubs();
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim()) {
      toast.error("Course name is required");
      return;
    }

    const { error } = await supabase.from("courses").insert({
      name: newCourse.trim(),
    });

    if (error) {
      toast.error("Failed to add course");
    } else {
      toast.success("Course added successfully");
      setNewCourse("");
      fetchCourses();
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    const { error } = await supabase
      .from("courses")
      .update({ name: editingCourse.name.trim() })
      .eq("id", editingCourse.id);

    if (error) {
      toast.error("Failed to update course");
    } else {
      toast.success("Course updated successfully");
      setEditingCourse(null);
      fetchCourses();
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const table = itemToDelete.type === "hub" ? "hubs" : itemToDelete.type === "course" ? "courses" : "staff";
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", itemToDelete.id);

    if (error) {
      toast.error(`Failed to delete ${itemToDelete.type}`);
    } else {
      toast.success(`${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} deleted successfully`);
      if (itemToDelete.type === "hub") fetchHubs();
      else if (itemToDelete.type === "course") fetchCourses();
      else fetchStaff();
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("staff").insert({
      name: newStaff.name,
      email: newStaff.email,
      role_name: newStaff.role_name,
      hub_id: newStaff.hub_id || null,
      phone: newStaff.phone || null,
    });

    if (error) {
      toast.error("Failed to add staff");
    } else {
      toast.success("Staff added successfully!");
      setNewStaff({ name: "", email: "", role_name: "", hub_id: "", phone: "" });
      fetchStaff();
    }
  };

  const handleDeleteStaff = (id: string) => {
    setItemToDelete({ type: "staff", id });
    setDeleteDialogOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error("Failed to change password");
    } else {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="bg-white/[0.06] p-2 rounded-lg">
              <img src="/logo.png" alt="Logo" className="h-auto w-auto max-h-12" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Manage
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="hubs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-8">
            <TabsTrigger value="hubs" className="gap-2">
              <Building2 className="h-4 w-4" />
              Hubs
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2">
              <Palette className="h-4 w-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          {/* Hubs Tab */}
          <TabsContent value="hubs" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Hub</h2>
              <form onSubmit={handleAddHub} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hubName">Hub Name *</Label>
                    <Input
                      id="hubName"
                      value={newHub.name}
                      onChange={(e) => setNewHub({ ...newHub, name: e.target.value })}
                      placeholder="e.g., Kochi Hub"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hubLocation">Location</Label>
                    <Input
                      id="hubLocation"
                      value={newHub.location}
                      onChange={(e) => setNewHub({ ...newHub, location: e.target.value })}
                      placeholder="e.g., Infopark, Kochi"
                      maxLength={200}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hub
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Existing Hubs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hubs.map((hub) => (
                  <Card key={hub.id} className="p-4">
                    {editingHub?.id === hub.id ? (
                      <form onSubmit={handleUpdateHub} className="space-y-3">
                        <Input
                          value={editingHub.name}
                          onChange={(e) => setEditingHub({ ...editingHub, name: e.target.value })}
                          placeholder="Hub name"
                          required
                        />
                        <Input
                          value={editingHub.location || ""}
                          onChange={(e) => setEditingHub({ ...editingHub, location: e.target.value })}
                          placeholder="Location"
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1">Save</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingHub(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="mb-3">
                          <h3 className="font-semibold">{hub.name}</h3>
                          {hub.location && <p className="text-sm text-muted-foreground">{hub.location}</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingHub(hub)} className="flex-1">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setItemToDelete({ type: "hub", id: hub.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Course</h2>
              <form onSubmit={handleAddCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input
                    id="courseName"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    placeholder="e.g., Flutter"
                    required
                    maxLength={100}
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Existing Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {courses.map((course) => (
                  <Card key={course.id} className="p-4">
                    {editingCourse?.id === course.id ? (
                      <form onSubmit={handleUpdateCourse} className="space-y-3">
                        <Input
                          value={editingCourse.name}
                          onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                          placeholder="Course name"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1">Save</Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setEditingCourse(null)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h3 className="font-semibold mb-3">{course.name}</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingCourse(course)} className="flex-1">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setItemToDelete({ type: "course", id: course.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffName">Name *</Label>
                    <Input
                      id="staffName"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffEmail">Email *</Label>
                    <Input
                      id="staffEmail"
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      placeholder="e.g., john@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffRole">Role *</Label>
                    <Input
                      id="staffRole"
                      value={newStaff.role_name}
                      onChange={(e) => setNewStaff({ ...newStaff, role_name: e.target.value })}
                      placeholder="e.g., Coordinator, Manager"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffHub">Hub</Label>
                    <Select value={newStaff.hub_id} onValueChange={(value) => setNewStaff({ ...newStaff, hub_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hub (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="">No Hub</SelectItem>
                        {hubs.map((hub) => (
                          <SelectItem key={hub.id} value={hub.id}>
                            {hub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staffPhone">Phone</Label>
                    <Input
                      id="staffPhone"
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      placeholder="e.g., +91 1234567890"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </form>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Existing Staff</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member) => (
                  <Card key={member.id} className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <Badge variant="outline" className="text-xs">{member.role_name}</Badge>
                      {member.hubs && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {member.hubs.name}
                        </p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-muted-foreground">{member.phone}</p>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteStaff(member.id)}
                        className="w-full mt-2"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Choose Theme</h2>
              <p className="text-muted-foreground mb-6">Select a theme to customize your admin portal appearance</p>
              <div className="space-y-4">
                <Select value={selectedTheme} onValueChange={applyTheme}>
                  <SelectTrigger className="w-full md:w-80">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {themes.map((theme) => (
                      <SelectItem key={theme.name} value={theme.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: `hsl(${theme.primary})` }}
                          />
                          {theme.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                  {themes.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => applyTheme(theme.name)}
                      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedTheme === theme.name ? "border-primary shadow-lg" : "border-border"
                      }`}
                    >
                      <div
                        className="w-full h-20 rounded mb-2"
                        style={{
                          background: `linear-gradient(135deg, hsl(${theme.primary}), hsl(${theme.secondary}))`,
                        }}
                      />
                      <p className="text-sm font-medium text-center">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card className="p-6 max-w-2xl">
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              <p className="text-muted-foreground mb-6">Update your admin account password</p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;
