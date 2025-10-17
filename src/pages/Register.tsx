import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
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
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const qrData = `EVENT-${Date.now()}-${data.email}`;

      const { error: dbError } = await supabase
        .from("attendees")
        .insert({ name: data.name, email: data.email, qr_code_data: qrData, phone: '0000000000' });

      if (dbError) {
        if (dbError.code === "23505") {
          toast.error("This email is already registered!");
        } else {
          throw dbError;
        }
        return;
      }

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      setQrCodeUrl(qrCodeDataUrl);

      const { error: emailError } = await supabase.functions.invoke("send-registration-email", {
        body: { email: data.email, name: data.name, qrCodeDataUrl: qrCodeDataUrl },
      });

      if (emailError) {
        console.error("Email error:", emailError);
        toast.warning("Registration successful");
      } else {
        toast.success("Registration successful! Check your email for the QR code.");
      }

      setRegistrationComplete(true);
    } catch (error: unknown) {
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

  const bgImage = registrationComplete ? "url(/qr.png)" : "url(/formbg.png)";

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: bgImage }}>
      <Card className="w-full max-w-md border-0 bg-transparent" style={{ transform: 'translateY(-20%)' }}>
        <CardContent className="pt-6">
          {!registrationComplete ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} style={{ backgroundColor: '#FAA20C', color: '#883226', borderColor: '#883226', outline: 'none', boxShadow: 'none' }} />
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
                      <FormLabel className="text-black">Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} style={{ backgroundColor: '#FAA20C', color: '#883226', borderColor: '#883226', outline: 'none', boxShadow: 'none' }} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-black text-white hover:bg-gray-800 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Counting you in...
                    </>
                  ) : (
                    "Count Me In"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="space-y-6 text-center animate-in fade-in-50 duration-500" style={{ transform: 'translateY(20%)' }}>
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[150px] mx-auto" />
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={downloadQRCode} className="w-full" style={{ backgroundColor: '#883226', color: '#FAA20C' }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
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