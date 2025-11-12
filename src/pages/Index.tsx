import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, LogOut, Users } from "lucide-react";
import PackageCheckIn from "@/components/PackageCheckIn";
import PackageCheckOut from "@/components/PackageCheckOut";
import ResidentsManagement from "@/components/ResidentsManagement";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-primary">Residential Delivery Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage package deliveries efficiently</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="check-in" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="check-in" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Check In</span>
            </TabsTrigger>
            <TabsTrigger value="check-out" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Check Out</span>
            </TabsTrigger>
            <TabsTrigger value="residents" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Residents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="check-in">
            <PackageCheckIn />
          </TabsContent>

          <TabsContent value="check-out">
            <PackageCheckOut />
          </TabsContent>

          <TabsContent value="residents">
            <ResidentsManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
