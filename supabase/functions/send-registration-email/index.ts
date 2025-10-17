import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  qrCodeDataUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, qrCodeDataUrl }: EmailRequest = await req.json();

    console.log(`Sending registration email to ${email} for ${name}`);

    // Convert base64 QR code to attachment
    const base64Data = qrCodeDataUrl.split(",")[1];

    const emailResponse = await resend.emails.send({
      from: "Event Registration <onboarding@resend.dev>",
      to: [email],
      subject: "Your Event Registration QR Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed; text-align: center;">Welcome to the Event!</h1>
          <p style="font-size: 16px; color: #333;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333;">
            Thank you for registering! Your QR code is attached below. 
            Please save this email and show the QR code at the event entrance.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <img src="${qrCodeDataUrl}" alt="Your QR Code" style="max-width: 300px; border: 2px solid #7c3aed; border-radius: 12px;" />
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            We look forward to seeing you at the event!
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "qr-code.png",
          content: base64Data,
        },
      ],
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
    console.error("Error in send-registration-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
