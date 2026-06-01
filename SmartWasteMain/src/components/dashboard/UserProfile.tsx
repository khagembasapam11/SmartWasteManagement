import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Award, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfile({ open, onOpenChange }: UserProfileProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("+91 98765-43210");
  const [address, setAddress] = useState("MG Road, Bangalore, India");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    }, 1000);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden glass border-white/20 shadow-glow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            View and manage your account information.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex flex-col items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-soft transition-transform group-hover:scale-105">
              <AvatarFallback className="bg-gradient-hero text-3xl text-white">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-success p-1.5 border-2 border-background text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          
          <div className="w-full space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={user.name} readOnly className="pl-9 bg-muted/30 focus-visible:ring-0 cursor-default" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assigned Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={user.email} readOnly className="pl-9 bg-muted/30 focus-visible:ring-0 cursor-default" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9 border-primary/20 focus-visible:ring-primary/40" placeholder="+91 XXXXX-XXXXX" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Home Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9 border-primary/20 focus-visible:ring-primary/40" placeholder="Street, City, Country" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4 border border-primary/10">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/20 p-2">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Eco-Points</p>
                  <p className="text-xl font-bold text-primary">{user.points || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-success uppercase tracking-widest px-2 py-0.5 rounded-full bg-success/10 border border-success/20">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-hero text-white shadow-glow"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
