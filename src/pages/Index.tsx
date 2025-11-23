import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MessageSquare, Shield, Zap, ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!loading && user && userRole) {
      const redirectPath = userRole === "admin" ? "/admin" : userRole === "staff" ? "/staff" : "/student";
      navigate(redirectPath);
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-primary opacity-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden relative">
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      {/* Mouse follower gradient */}
      <div 
        className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
        }}
      />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-24 md:py-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-block mb-6 animate-[fadeIn_0.8s_ease-out]">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Welcome to Complaint Management</span>
              </div>
            </div>

           
         <div className="flex justify-center mb-8 animate-[slideUp_0.8s_ease-out]">
  <div className="relative inline-block">
    <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl" />
    
    <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 w-fit h-fit flex items-center justify-center p-3">
      <img 
        src="/logo.png" 
        alt="Brototype Logo" 
        className="object-contain max-w-48 md:max-w-64 drop-shadow-2xl hover:scale-105 transition-transform duration-300"
      />
    </div>
  </div>
</div>

            
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 animate-[slideUp_1s_ease-out] max-w-3xl mx-auto leading-relaxed">
              Streamlined complaint management system designed for seamless communication between students, staff, and administrators
            </p>

            {/* Portal Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-[slideUp_1.2s_ease-out]">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="group bg-gradient-primary hover:opacity-90 transition-all duration-300 text-lg px-10 py-7 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Student Portal
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/staff/auth")}
                className="group text-lg px-10 py-7 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Staff Portal
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              
              <Button
                size="lg"
                variant="destructive"
                onClick={() => navigate("/admin/login")}
                className="group text-lg px-10 py-7 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Admin Portal
                  <Shield className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground animate-[fadeIn_1.4s_ease-out] flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
              Students & Staff: Sign up or sign in • Admins: Use dedicated portal
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-24">
            {[
              {
                icon: MessageSquare,
                title: "Easy Submission",
                description: "Submit complaints quickly with our intuitive and user-friendly interface designed for efficiency",
                delay: "0s"
              },
              {
                icon: Zap,
                title: "Real-time Tracking",
                description: "Track the status of your complaints in real-time with instant notifications and updates",
                delay: "0.2s"
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security and end-to-end encryption",
                delay: "0.4s"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-gradient-card border border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 backdrop-blur-sm animate-[fadeInScale_0.8s_ease-out] relative overflow-hidden"
                style={{ animationDelay: feature.delay }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-24 grid grid-cols-3 gap-8 p-8 rounded-2xl bg-gradient-card border border-primary/10 backdrop-blur-sm animate-[fadeIn_1.6s_ease-out]">
            {[
              { label: "Active Users", value: "1000+" },
              { label: "Resolved Cases", value: "5000+" },
              { label: "Response Time", value: "<24h" }
            ].map((stat, index) => (
              <div key={index} className="text-center group cursor-default">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;