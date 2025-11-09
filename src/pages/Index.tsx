import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MessageSquare, Calendar, Users } from "lucide-react";
import Tiet from '../../public/Tiet.jpg'
import logo from '../../public/logoweb.png'

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a202c] via-[#2d3748] to-[#1a202c]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1a202c]/50 backdrop-blur animate-fade-in">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            
              <img className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground" src={logo} alt="Logo" />
            
            <span className="text-xl font-bold text-white">CampusPal</span>
          </div>
          <Link to="/login">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 animate-slide-up text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Your Campus,
              <br />
              Connected.
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-md mx-auto lg:mx-0">
              The ultimate social network for college students to chat, share, and discover events.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 w-full sm:w-auto">
                  Sign Up for Free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 h-12 px-8 w-full sm:w-auto">
                  Already have account? Log In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative animate-scale-in" style={{ animationDelay: '200ms' }}>
            <img className="aspect-[4/3] rounded-2xl gradient-hero shadow-hover" src={Tiet} alt="TIET image" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12 animate-slide-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">What You Can Do on CampusPal</h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto px-4">
            Everything you need to stay connected with your campus community, all in one place.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              icon: MessageSquare,
              title: "Share Your Moments",
              description: "Share updates, photos, and academic triumphs with your peers in a dynamic feed.",
            },
            {
              icon: Users,
              title: "Instant Connections",
              description: "Use direct messaging and create group chats for your classes, clubs, or friend groups.",
            },
            {
              icon: Calendar,
              title: "Discover Campus Events",
              description: "Find and join campus parties, study groups, workshops, and other exciting events.",
            },
          ].map((feature, i) => (
            <Card
              key={i}
              className="bg-[#2d3748] border-white/10 p-6 space-y-4 hover:bg-[#374151] transition-smooth animate-scale-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#1a202c]/50 backdrop-blur mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">C</span>
              </div>
              <span className="text-lg font-bold text-white">CampusPal</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-300">
              <Link to="/about" className="hover:text-white transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400 mt-6">
            © 2025 CampusPal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
