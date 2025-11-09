import { NavLink, useLocation } from "react-router-dom";
import { Home, MessageSquare, Calendar, User, Search, Users, Settings, ShoppingBag, BookOpen, FileSearch, UsersRound, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from '../../public/logoweb.png'

const navigation = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Events", href: "/events", icon: Calendar },
    {name: "Placements & Internships" ,href:"/placements" ,icon: Briefcase},
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

export const Sidebar = () => {
    const location = useLocation();

    return (
        <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:flex bg-card border-r border-border transition-smooth animate-fade-in">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b border-border px-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <img src={logo} alt="CampusPal Logo" />
                    </div>
                    <span className="text-xl font-bold">CampusPal</span>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;

                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth relative",
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

                {/* Bottom Navigation */}
                <nav className="space-y-1 border-t border-border px-3 py-4">
                    {bottomNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
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
        </aside>
    );
};
