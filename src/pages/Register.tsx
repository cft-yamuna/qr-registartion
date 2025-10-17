import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Download, Mail, Loader2, CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(10, "Phone must be at least 10 digits").max(15),
});

type FormData = z.infer<typeof formSchema>;

const Register = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Generate unique QR code data
      const qrData = `EVENT-${Date.now()}-${data.email}`;

      // Insert into database
      const { error: dbError } = await supabase
        .from("attendees")
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          qr_code_data: qrData,
        });

      if (dbError) {
        if (dbError.code === "23505") {
          toast.error("This email is already registered!");
        } else {
          throw dbError;
        }
        return;
      }

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: "#7c3aed",
          light: "#ffffff",
        },
      });

      setQrCodeUrl(qrCodeDataUrl);

      // Send email with QR code
      const { error: emailError } = await supabase.functions.invoke("send-registration-email", {
        body: {
          email: data.email,
          name: data.name,
          qrCodeDataUrl: qrCodeDataUrl,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast.warning("Registration successful, but email failed to send. You can still download your QR code.");
      } else {
        toast.success("Registration successful! Check your email for the QR code.");
      }

      setRegistrationComplete(true);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement("a");
    link.download = "event-qr-code.png";
    link.href = qrCodeUrl;
    link.click();
    toast.success("QR code downloaded!");
  };

  const handleNewRegistration = () => {
    setQrCodeUrl("");
    setRegistrationComplete(false);
    form.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Event Registration
          </CardTitle>
          <CardDescription className="text-base">
            Register for the event and get your QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!registrationComplete ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Now"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-500">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Registration Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your QR code has been sent to your email
                </p>
              </div>
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={downloadQRCode} className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                <Button onClick={handleNewRegistration} className="w-full">
                  Register Another Attendee
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
