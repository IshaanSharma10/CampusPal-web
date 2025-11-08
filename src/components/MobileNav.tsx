import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageSquare, Calendar, Briefcase, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavigation = [
  { name: "Feed", href: "/feed", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Placements", href: "/placements", icon: Briefcase },
  { name: "Study", href: "/study-corner", icon: BookOpen },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavigation.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-smooth relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
