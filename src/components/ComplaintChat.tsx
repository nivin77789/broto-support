import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ComplaintChatProps {
  complaintId: string;
  currentUserId: string;
  currentUserName: string;
}

export const ComplaintChat = ({ complaintId, currentUserId, currentUserName }: ComplaintChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `complaint_id=eq.${complaintId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaintId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch sender names
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", senderIds);

      const namesMap: Record<string, string> = {};
      profilesData?.forEach(p => {
        namesMap[p.id] = p.name;
      });

      setSenderNames(namesMap);
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("messages").insert({
        complaint_id: complaintId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-card">
      <h3 className="text-lg font-semibold mb-4">Chat</h3>
      
      <ScrollArea className="h-[400px] mb-4 pr-4" ref={scrollRef}>
        <div className="space-y-3">
          {messages.map((message) => {
            const isCurrentUser = message.sender_id === currentUserId;
            const senderName = senderNames[message.sender_id] || "Unknown";
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-semibold mb-1">{senderName}</p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? 'opacity-70' : 'text-muted-foreground'}`}>
                    {format(new Date(message.created_at), "MMM dd, HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          maxLength={1000}
        />
        <Button type="submit" size="icon" disabled={loading || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};
