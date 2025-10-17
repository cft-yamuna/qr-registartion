import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { XCircle } from "lucide-react";

const FUN_MESSAGES: string[] = [
    "You're the life of the party! Let's get this event started.",
    "The legendary [PARTY_TITLE] has arrived! Prepare for good times.",
    "Scanned and approved! We knew you wouldn't miss the free food.",
    "Welcome! Please try not to start a dance-off... unless it's a good one.",
    "Access granted! Your vibe check passed with flying colors.",
    "We saved you a spot near the snacks. You know where to go.",
    "Ah, a connoisseur of fine events! Welcome aboard.",
    "Congratulations! You managed to find your ticket. That deserves a prize.",
    "Ready to make some questionable life choices tonight? Welcome!",
    "Your attendance just raised the event's coolness factor by 10 points.",
    "Confirmed! Did you remember to leave your spreadsheets at the door?",
    "Hello, superstar! Thanks for gracing us with your presence.",
    "The one and only! Time to relax and enjoy the night.",
    "We were starting to worry! Glad you made it, party person.",
    "Warning: Fun levels are about to reach maximum capacity. Welcome!",
    "You're not just an attendee, you're a vibe. Welcome!",
    "Your check-in status is: Ready to Mingle. Have fun!",
    "Don't worry, your secrets are safe with us... for now. Welcome!",
    "Party animal detected! Proceed to the fun zone.",
    "Welcome back! Your reputation precedes you (in the best way).",
    "Finally, the cool person is here! Welcome to the event.",
    "Officially checked in! Now go forth and be awesome.",
    "Ready to socialize? Your networking skills are unmatched. Welcome!",
    "Your manager said you deserve this night off. Enjoy!",
    "VIP Access granted! Just kidding, everyone's a VIP tonight. Welcome!",
    "Checked in! Let's make some memories that we'll forget tomorrow.",
    "Look who decided to show up! Glad you could make it.",
    "The attendance gods smile upon you. Welcome!",
    "Your spirit animal is a disco ball. Shine bright!",
    "Your event readiness is at 100%. Enjoy the celebration!",
    "We appreciate you making the effort. Now, go have some fun!",
    "Welcome! The drinks are calling your name.",
    "You've been expecting us! Now we've been expecting you.",
    "Your official status: Certified Good Time Contributor.",
    "Welcome! Remember to take breaks from being so amazing.",
    "The code is good, the person is better. Welcome!",
    "Your punctuality is appreciated! Now go enjoy the chaos.",
    "Checked in! Find your favorite coworker and say hello.",
    "The evening just got a lot more interesting. Welcome!",
    "You made it! We were holding the fort down just for you."
];

const Scanner = () => {
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

  const qrCodeSuccessCallback = useCallback(async (decodedText: string) => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
      return;
    }

    console.log("QR Code scanned:", decodedText);
    scannerRef.current?.pause(true);

    const { data: attendee, error } = await supabase
      .from("attendees")
      .select("*")
      .eq("qr_code_data", decodedText)
      .single();

    if (error || !attendee) {
      setLastScan({ success: false, message: "Invalid QR code!" });
      toast.error("Invalid QR code!");
      setTimeout(() => {
        setLastScan(null);
        scannerRef.current?.resume();
      }, 5000);
      return;
    }

    if (attendee.is_scanned) {
      setLastScan({ success: false, name: attendee.name, message: "Already checked in!" });
      toast.warning(`${attendee.name}, you have already checked in!`);
      setTimeout(() => {
        setLastScan(null);
        scannerRef.current?.resume();
      }, 5000);
      return;
    }

    const { error: updateError } = await supabase
      .from("attendees")
      .update({ is_scanned: true, scanned_at: new Date().toISOString() })
      .eq("id", attendee.id);

    if (updateError) {
      setLastScan({ success: false, message: "Error updating check-in status" });
      toast.error("Error updating check-in status");
      setTimeout(() => {
        setLastScan(null);
        scannerRef.current?.resume();
      }, 5000);
      return;
    }

    const randomMessage = FUN_MESSAGES[Math.floor(Math.random() * FUN_MESSAGES.length)];
    
    setLastScan({ success: true, name: attendee.name, message: randomMessage });
    setShowConfetti(true);
    toast.success(`Welcome ${attendee.name}! ${randomMessage}`);

    setTimeout(() => {
      setShowConfetti(false);
      setLastScan(null);
      scannerRef.current?.resume();
    }, 5000);
  }, []);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader");
    const config = { fps: 10 };

    scannerRef.current.start(
      { facingMode: "user" },
      config,
      qrCodeSuccessCallback,
      () => {}
    ).catch(error => {
      console.error("Scanner error:", error);
      toast.error("Failed to start camera. Please check permissions.");
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [qrCodeSuccessCallback]);

  const bgImage = lastScan?.success ? "url(/s2.png)" : "url(/s1.png)";

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: bgImage }}
    >
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}
      
      <div id="qr-reader" className={`w-1/3 h-auto ${lastScan ? 'hidden' : ''}`} style={{ transform: 'translateY(20%)' }}></div>

      {lastScan && (
        <div className="max-w-lg text-center" style={{ transform: 'translateY(60%)' }}>
          {lastScan.success ? (
            <div className="space-y-4 py-4">
              {lastScan.name && (
                  <p className="text-8xl font-black text-black tracking-wide leading-none py-2">
                     {lastScan.name}
                  </p>
              )}
              <p className="text-3xl font-semibold mt-2 text-black">
                 {lastScan.message}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-6 rounded-xl bg-white/80 backdrop-blur-sm border-2 animate-in fade-in-50 duration-500 transition-all shadow-2xl">
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
      )}
    </div>
  );
};

export default Scanner;