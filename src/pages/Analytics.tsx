import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--success))'];

const Analytics = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [complaintsRes, hubsRes] = await Promise.all([
        supabase.from("complaints").select("*"),
        supabase.from("hubs").select("*")
      ]);

      if (complaintsRes.error) throw complaintsRes.error;
      if (hubsRes.error) throw hubsRes.error;

      setComplaints(complaintsRes.data || []);
      setHubs(hubsRes.data || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Status Distribution
  const statusData = [
    { name: "Pending", value: complaints.filter(c => c.status === "Pending").length },
    { name: "In Review", value: complaints.filter(c => c.status === "In Review").length },
    { name: "Resolved", value: complaints.filter(c => c.status === "Resolved").length }
  ];

  // Hub-based Complaints
  const hubData = hubs.map(hub => ({
    name: hub.name,
    complaints: complaints.filter(c => c.hub_id === hub.id).length,
    pending: complaints.filter(c => c.hub_id === hub.id && c.status === "Pending").length,
    resolved: complaints.filter(c => c.hub_id === hub.id && c.status === "Resolved").length
  })).sort((a, b) => b.complaints - a.complaints).slice(0, 5);

  // Category Distribution
  const categoryData = [
    { name: "Comuncaton", value: complaints.filter(c => c.category === "Communication").length },
    { name: "Hub", value: complaints.filter(c => c.category === "Hub").length },
    { name: "Review", value: complaints.filter(c => c.category === "Review").length },
    { name: "Payments", value: complaints.filter(c => c.category === "Payments").length },
    { name: "Others", value: complaints.filter(c => c.category === "Others").length }
  ].filter(item => item.value > 0);

  // Urgency Distribution
  const urgencyData = [
    { name: "Low", value: complaints.filter(c => c.urgency === "Low").length },
    { name: "Normal", value: complaints.filter(c => c.urgency === "Normal").length },
    { name: "High", value: complaints.filter(c => c.urgency === "High").length },
    { name: "Critical", value: complaints.filter(c => c.urgency === "Critical").length }
  ];

  // Trend over time (last 7 days)
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const trendData = getLast7Days().map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    complaints: complaints.filter(c => c.created_at?.startsWith(date)).length
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">Comprehensive complaint analytics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 max-w-7xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { title: "Total Complaints", value: complaints.length, icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10" },
            { title: "Pending", value: statusData[0].value, icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
            { title: "In Review", value: statusData[1].value, icon: AlertCircle, color: "text-primary", bgColor: "bg-primary/10" },
            { title: "Resolved", value: statusData[2].value, icon: CheckCircle, color: "text-success", bgColor: "bg-success/10" }
          ].map((item, idx) => (
            <Card 
              key={idx} 
              className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-2" 
              style={{ animationDelay: `${idx * 50}ms`, animationDuration: '500ms' }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{item.title}</p>
                    <p className="text-2xl font-bold">{item.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${item.bgColor} flex-shrink-0`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          

          {/* Status Distribution */}
          <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '250ms', animationDuration: '500ms' }}>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Status Distribution</h3>
                <p className="text-xs text-muted-foreground">Overall breakdown</p>
              </div>
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '300ms', animationDuration: '500ms' }}>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Complaints by Category</h3>
                <p className="text-xs text-muted-foreground">Category breakdown</p>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Complaints" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Urgency Distribution */}
          <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '350ms', animationDuration: '500ms' }}>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Urgency Levels</h3>
                <p className="text-xs text-muted-foreground">Priority distribution</p>
              </div>
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={urgencyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {urgencyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '12px' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
{/* Trend Line Chart */}
          <Card className="md:col-span-2 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '200ms', animationDuration: '500ms' }}>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Complaint Trend (Last 7 Days)</h3>
                <p className="text-xs text-muted-foreground">Daily complaint submissions</p>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="complaints" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Complaints"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Hub Complaints */}
          <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '400ms', animationDuration: '500ms' }}>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold">Complaints by Hub</h3>
                <p className="text-xs text-muted-foreground">Top 5 hubs</p>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hubData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '6px', 
                        fontSize: '12px' 
                      }} 
                    />
                    <Bar dataKey="complaints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Analytics;