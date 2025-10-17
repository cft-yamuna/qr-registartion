import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, TrendingUp, Clock } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalRegistered: number;
  totalScanned: number;
  percentageScanned: number;
  recentRegistrations: Array<{ name: string; email: string; created_at: string }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalRegistered: 0,
    totalScanned: 0,
    percentageScanned: 0,
    recentRegistrations: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get total registered
      const { count: totalCount } = await supabase
        .from("attendees")
        .select("*", { count: "exact", head: true });

      // Get total scanned
      const { count: scannedCount } = await supabase
        .from("attendees")
        .select("*", { count: "exact", head: true })
        .eq("is_scanned", true);

      // Get recent registrations
      const { data: recent } = await supabase
        .from("attendees")
        .select("name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const total = totalCount || 0;
      const scanned = scannedCount || 0;
      const percentage = total > 0 ? Math.round((scanned / total) * 100) : 0;

      setStats({
        totalRegistered: total,
        totalScanned: scanned,
        percentageScanned: percentage,
        recentRegistrations: recent || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime subscription for live updates
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendees",
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Event Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Real-time event statistics and attendee tracking</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Registered */}
          <Card className="border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalRegistered}</div>
              <p className="text-xs text-muted-foreground mt-1">Total attendees registered</p>
            </CardContent>
          </Card>

          {/* Total Checked In */}
          <Card className="border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalScanned}</div>
              <p className="text-xs text-muted-foreground mt-1">Attendees checked in</p>
            </CardContent>
          </Card>

          {/* Check-in Rate */}
          <Card className="border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.percentageScanned}%</div>
              <p className="text-xs text-muted-foreground mt-1">Of total registrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card className="border-0" style={{ boxShadow: "var(--shadow-glow)" }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <CardTitle>Recent Registrations</CardTitle>
            </div>
            <CardDescription>Latest attendees who registered for the event</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRegistrations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No registrations yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentRegistrations.map((reg, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100"
                  >
                    <div>
                      <p className="font-semibold">{reg.name}</p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDate(reg.created_at)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
