import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";

export default function Settings() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="ml-64 flex-1">
        <Header />
        
        <main className="p-6 max-w-5xl mx-auto animate-slide-up">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences.</p>
          </div>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList>
              <TabsTrigger value="account">My Account</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Safety</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-6">Profile Information</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder.svg" alt="Alex Doe" />
                    <AvatarFallback className="text-lg">AD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">Alex Doe</h4>
                    <p className="text-sm text-muted-foreground">Computer Science</p>
                  </div>
                  <Button variant="outline">Change Photo</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" defaultValue="Alex Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input id="major" defaultValue="Computer Science" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-6">Account Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="alex.doe@campus.edu" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" defaultValue="••••••••••" />
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-4">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Control who can see your content and interact with you on CampusPal.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Manage how you receive notifications from CampusPal.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-bold mb-4">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize how CampusPal looks on your device.
                </p>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-6 p-4 border-destructive/50 bg-destructive/5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-destructive mb-1">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all of your content.
                </p>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </Card>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Alex Doe</span>
              <span>•</span>
              <span>alex.doe@campus.edu</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
