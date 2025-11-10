import {
  Search,
  MessageSquare,
  Menu,
  Home,
  Calendar,
  Users,
  ShoppingBag,
  BookOpen,
  FileSearch,
  UsersRound,
  Briefcase,
  User,
  Settings,
  Bell,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";
import logo from "../../public/logoweb.png";

const navigation = [
  { name: "Feed", href: "/feed", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Placements & Internships", href: "/placements", icon: Briefcase },
  { name: "Directory", href: "/directory", icon: UsersRound },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Study Corner", href: "/study-corner", icon: BookOpen },
  { name: "Lost & Found", href: "/lost-found", icon: FileSearch },
  { name: "Clubs", href: "/clubs", icon: Users },
];

const bottomNavigation = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Header = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profilePic, setProfilePic] = useState<string>("");

  // ✅ Fetch profilePic from Firestore (latest Supabase URL)
  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfilePic(data.profilePic || currentUser.photoURL || "/placeholder.svg");
        } else {
          setProfilePic(currentUser.photoURL || "/placeholder.svg");
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
        setProfilePic(currentUser.photoURL || "/placeholder.svg");
      }
    };

    fetchProfilePic();
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 animate-fade-in">
      <div className="flex h-16 items-center gap-2 sm:gap-4 px-4 sm:px-6">
        {/* ✅ Mobile Menu */}
        <div className="flex lg:hidden items-center gap-2">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[85vh]">
              <DrawerHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <img className="h-10 w-10 rounded-xl" src={logo} alt="CampusPal Logo" />
                  <DrawerTitle className="text-xl font-bold">CampusPal</DrawerTitle>
                </div>
              </DrawerHeader>

              <div className="overflow-y-auto p-4">
                <nav className="space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-smooth",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>

                <div className="border-t border-border my-4" />

                <nav className="space-y-1">
                  {bottomNavigation.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-smooth",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
            </DrawerContent>
          </Drawer>
          <img className="h-8 w-8 rounded-lg" src={logo} alt="CampusPal Logo" />
        </div>

        {/* ✅ Search */}
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
            />
          </div>
        </div>

        {/* ✅ Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          <div className="hidden lg:block">
            <NotificationDropdown />
          </div>

          {/* Mobile Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 relative"
            onClick={() => (window.location.href = "/notifications")}
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* Chat Shortcut */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex lg:flex h-9 w-9"
            onClick={() => (window.location.href = "/chat")}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* ✅ User Avatar */}
          <div
            className="cursor-pointer"
            onClick={() => {
              if (window.innerWidth < 1024) {
                window.location.href = "/profile";
              }
            }}
          >
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-transparent hover:ring-primary transition-smooth">
              <AvatarImage src={profilePic} alt={currentUser?.displayName || "User"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {currentUser?.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
};
