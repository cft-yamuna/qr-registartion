import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Camera, Loader2 } from "lucide-react";
import Confetti from "react-confetti";

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<{ success: boolean; name?: string; message: string } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setLastScan(null);

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = async (decodedText: string) => {
        console.log("QR Code scanned:", decodedText);

        // Stop scanning and explicitly hide the camera feed
        await stopScanning();
        
        // Verify QR code in database
        const { data: attendee, error } = await supabase
          .from("attendees")
          .select("*")
          .eq("qr_code_data", decodedText)
          .single();

        if (error || !attendee) {
          setLastScan({
            success: false,
            message: "Invalid QR code! This attendee is not registered.",
          });
          toast.error("Invalid QR code!");
          // Restart scanning after delay
          setTimeout(() => startScanning(), 3000);
          return;
        }

        if (attendee.is_scanned) {
          setLastScan({
            success: false,
            name: attendee.name,
            message: `${attendee.name}, you have already checked in!`,
          });
          toast.warning("Already checked in!");
          setTimeout(() => startScanning(), 3000);
          return;
        }

        // Mark as scanned
        const { error: updateError } = await supabase
          .from("attendees")
          .update({
            is_scanned: true,
            scanned_at: new Date().toISOString(),
          })
          .eq("id", attendee.id);

        if (updateError) {
          toast.error("Error updating check-in status");
          setTimeout(() => startScanning(), 3000);
          return;
        }

        setLastScan({
          success: true,
          name: attendee.name,
          message: `${attendee.name}, welcome to the event!`,
        });
        setShowConfetti(true);
        toast.success(`Welcome ${attendee.name}!`);

        setTimeout(() => {
          setShowConfetti(false);
          startScanning();
        }, 4000);
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        qrCodeSuccessCallback,
        () => {} // Ignore error logs
      );
    } catch (error) {
      console.error("Scanner error:", error);
      toast.error("Failed to start camera. Please check permissions.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setScanning(false); 
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      <Card className="w-full max-w-2xl shadow-lg border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Event Check-In Scanner
          </CardTitle>
          <CardDescription className="text-base">
            Scan attendee QR codes for event entry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="qr-reader" className={`${scanning ? "block" : "hidden"} rounded-lg overflow-hidden`}></div>

          {!scanning && !lastScan && ( 
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Camera className="h-24 w-24 text-purple-600 opacity-50" />
              <Button
                onClick={startScanning}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            </div>
          )}

          {scanning && !lastScan && (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Stop Scanning
            </Button>
          )}

          {lastScan && (
            <div
              className={`p-6 rounded-xl border-2 animate-in fade-in-50 duration-500 transition-all shadow-2xl ${ // Enhanced shadow
                lastScan.success
                  ? "bg-green-100 border-green-400 transform scale-105" // Stronger success styling
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                {lastScan.success ? (
                  // --- START: Enhanced Success UI ---
                  <div className="space-y-4 py-4">
                    <CheckCircle2 className="h-24 w-24 text-green-500 flex-shrink-0 animate-bounce" /> {/* Larger, bouncier icon */}
                    
                    <h3 className="text-3xl font-extrabold text-green-900 leading-tight">
                      <span className="block text-4xl bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-lime-500 drop-shadow-md">
                         CHECK-IN COMPLETE
                      </span>
                    </h3>

                    {/* Attendee Name: Biggest and most prominent */}
                    {lastScan.name && (
                        <p className="text-6xl font-black text-green-800 tracking-wide leading-none py-2">
                           {lastScan.name}
                        </p>
                    )}

                    <p className="text-xl text-green-700 font-semibold mt-2 border-t pt-4 border-green-300">
                       {/* Clean up message to avoid repeating the name if already shown big */}
                       Welcome to the event!
                    </p>
                  </div>
                  // --- END: Enhanced Success UI ---
                ) : (
                  // --- Failure UI ---
                  <div className="flex items-center gap-4">
                    <XCircle className="h-12 w-12 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className={`text-xl font-bold text-red-900`}>
                        Check-In Failed
                      </h3>
                      <p className={`text-lg text-red-700`}>
                        {lastScan.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Scanner;