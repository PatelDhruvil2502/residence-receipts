import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Calendar, MapPin, User } from "lucide-react";
import { format } from "date-fns";

const PackageCheckOut = () => {
  const { toast } = useToast();
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [residents, setResidents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<any[]>([]);
  const [selectedResident, setSelectedResident] = useState<any>(null);
  const [checkOutBy, setCheckOutBy] = useState("");

  useEffect(() => {
    fetchResidents();
    fetchPackages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('packages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages'
        },
        () => {
          fetchPackages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchResidents = async () => {
    const { data, error } = await supabase
      .from("residents")
      .select("*")
      .order("name");
    
    if (!error && data) {
      setResidents(data);
    }
  };

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select(`
        *,
        residents (name, house_number),
        storage_locations (location_name)
      `)
      .order("checked_in_at", { ascending: false });
    
    if (!error && data) {
      setPackages(data);
    }
  };

  const handleResidentChange = (value: string) => {
    setSelectedResidentId(value);
    
    if (!value) {
      setFilteredPackages([]);
      setSelectedResident(null);
      return;
    }

    const resident = residents.find(r => r.id === value);

    if (resident) {
      setSelectedResident(resident);
      const residentPackages = packages.filter(
        p => p.resident_id === resident.id && p.status === 'checked_in'
      );
      setFilteredPackages(residentPackages);
    } else {
      setSelectedResident(null);
      setFilteredPackages([]);
    }
  };

  const handleCheckOut = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from("packages")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
          checked_out_by: checkOutBy || "Staff",
        })
        .eq("id", packageId);

      if (error) throw error;

      toast({
        title: "Package checked out successfully",
        description: "The package has been delivered to the resident",
      });

      fetchPackages();
      handleResidentChange(selectedResidentId); // Refresh filtered results
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Package Check-Out</CardTitle>
          <CardDescription>Search and deliver packages to residents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedResidentId} onValueChange={handleResidentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resident to check out packages" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((resident) => (
                    <SelectItem key={resident.id} value={resident.id}>
                      {resident.name} - House {resident.house_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Checked out by"
              value={checkOutBy}
              onChange={(e) => setCheckOutBy(e.target.value)}
              className="w-48"
            />
          </div>

          {selectedResident && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedResident.name}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">House: {selectedResident.house_number}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Available Packages</h3>
          {filteredPackages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-lg">{pkg.package_id}</span>
                      <Badge variant={pkg.status === 'checked_in' ? 'default' : 'secondary'}>
                        {pkg.status === 'checked_in' ? 'Available' : 'Checked Out'}
                      </Badge>
                    </div>
                    
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {pkg.color && (
                        <div>
                          <span className="text-muted-foreground">Color:</span>
                          <span className="ml-2 font-medium">{pkg.color}</span>
                        </div>
                      )}
                      {pkg.size && (
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <span className="ml-2 font-medium">{pkg.size}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{pkg.storage_locations?.location_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(pkg.checked_in_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>

                    {pkg.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1">{pkg.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  {pkg.status === 'checked_in' && (
                    <Button onClick={() => handleCheckOut(pkg.id)}>
                      Check Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Check-Outs</CardTitle>
          <CardDescription>Recently delivered packages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {packages
              .filter(p => p.status === 'checked_out')
              .slice(0, 5)
              .map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pkg.package_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {pkg.residents?.name} - {pkg.residents?.house_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{format(new Date(pkg.checked_out_at), 'MMM dd, yyyy')}</p>
                    <p className="text-xs">{pkg.checked_out_by}</p>
                  </div>
                </div>
              ))}
            {packages.filter(p => p.status === 'checked_out').length === 0 && (
              <p className="text-center text-muted-foreground py-4">No check-outs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageCheckOut;
