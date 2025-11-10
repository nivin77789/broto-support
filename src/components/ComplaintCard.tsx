import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Clock } from "lucide-react";

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    category: string;
    status: string;
    created_at: string;
    description: string;
    resolution_note?: string;
  };
  onClick?: () => void;
  showStudent?: boolean;
  studentName?: string;
}

export const ComplaintCard = ({ complaint, onClick, showStudent, studentName }: ComplaintCardProps) => {
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Technical: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      Hostel: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      Mentor: "bg-green-500/10 text-green-500 border-green-500/20",
      Financial: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      Infrastructure: "bg-red-500/10 text-red-500 border-red-500/20",
      Other: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[category] || colors.Other;
  };

  return (
    <Card
      className="p-6 cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] bg-gradient-card border"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-lg">{complaint.title}</h3>
          </div>
          {showStudent && studentName && (
            <p className="text-sm text-muted-foreground mb-2">Student: {studentName}</p>
          )}
        </div>
        <Badge className={getStatusColor(complaint.status)} variant="outline">
          {complaint.status}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {complaint.description}
      </p>

      <div className="flex items-center justify-between">
        <Badge className={getCategoryColor(complaint.category)} variant="outline">
          {complaint.category}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {format(new Date(complaint.created_at), "MMM dd, yyyy")}
        </div>
      </div>

      {complaint.resolution_note && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-1">Resolution:</p>
          <p className="text-sm">{complaint.resolution_note}</p>
        </div>
      )}
    </Card>
  );
};
