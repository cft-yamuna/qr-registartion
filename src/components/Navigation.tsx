import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserPlus, Scan, LayoutDashboard } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Event Manager
            </span>
          </div>
          
          <div className="flex gap-2">
            <Link to="/register">
              <Button
                variant={isActive("/register") ? "default" : "ghost"}
                className={isActive("/register") ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </Button>
            </Link>
            <Link to="/scanner">
              <Button
                variant={isActive("/scanner") ? "default" : "ghost"}
                className={isActive("/scanner") ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                <Scan className="mr-2 h-4 w-4" />
                Scanner
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                className={isActive("/dashboard") ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
