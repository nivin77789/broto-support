import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ForwardComplaintRequest {
  staffEmail: string;
  staffName: string;
  complaintTitle: string;
  complaintDescription: string;
  complaintCategory: string;
  complaintStatus: string;
  complaintUrgency: string;
  studentName: string;
  createdAt: string;
  complaintUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      staffEmail,
      staffName,
      complaintTitle,
      complaintDescription,
      complaintCategory,
      complaintStatus,
      complaintUrgency,
      studentName,
      createdAt,
      complaintUrl,
    }: ForwardComplaintRequest = await req.json();

    console.log("Forwarding complaint to:", staffEmail);

    const emailResponse = await resend.emails.send({
      from: "Brototype Complaints <onboarding@resend.dev>",
      to: [staffEmail],
      subject: `Forwarded Complaint: ${complaintTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; padding: 8px; background: white; border-left: 3px solid #667eea; }
              .label { font-weight: bold; color: #555; }
              .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .badge-urgent { background: #fee; color: #c00; }
              .badge-normal { background: #e3f2fd; color: #1976d2; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Complaint Forwarded to You</h2>
              </div>
              <div class="content">
                <p>Hello ${staffName},</p>
                <p>A complaint has been forwarded to you for review and action.</p>
                
                <div class="info-row">
                  <span class="label">Title:</span> ${complaintTitle}
                </div>
                
                <div class="info-row">
                  <span class="label">Category:</span> ${complaintCategory}
                </div>
                
                <div class="info-row">
                  <span class="label">Student:</span> ${studentName}
                </div>
                
                <div class="info-row">
                  <span class="label">Status:</span> ${complaintStatus}
                </div>
                
                <div class="info-row">
                  <span class="label">Urgency:</span> 
                  <span class="badge ${complaintUrgency === 'Critical' || complaintUrgency === 'High' ? 'badge-urgent' : 'badge-normal'}">${complaintUrgency}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Submitted:</span> ${new Date(createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                
                <div class="info-row">
                  <span class="label">Description:</span>
                  <p style="margin: 10px 0; white-space: pre-wrap;">${complaintDescription}</p>
                </div>
                
                <a href="${complaintUrl}" class="button">View Full Complaint</a>
                
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                  Please review this complaint and take appropriate action.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in forward-complaint function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
