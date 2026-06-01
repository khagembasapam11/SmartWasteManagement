import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Recycle, Mail, Lock, User as UserIcon, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";
import { toast } from "sonner";

interface Props { mode: "login" | "register" }

const roles: { id: Role; label: string; desc: string; icon: typeof UserIcon }[] = [
  { id: "user", label: "Citizen", desc: "Report waste in your area", icon: UserIcon },
  { id: "admin", label: "Admin", desc: "Manage city-wide reports", icon: Shield },
  { id: "worker", label: "Worker", desc: "Handle assigned tasks", icon: Truck },
];

import Logo from "@/components/ui/Logo";
import { Loader2 } from "lucide-react";

export default function AuthPage({ mode }: Props) {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [swmCode, setSwmCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return toast.error("Please fill all fields");
    }

    if (mode === "register" && !name) {
      return toast.error("Please enter your name");
    }

    if (mode === "register" && role === "worker") {
      if (!phone || !address || !location || !swmCode) {
        return toast.error("Please fill all worker details");
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const user = await login({ email, password });
        if (user) {
          toast.success("Welcome back!");
          nav(`/${user.role}`);
        }
      } else {
        const user = await register({ name, email, password, role, phone, address, location, swmCode });
        if (user) {
          toast.success("Account created!");
          nav(`/${user.role}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-hero lg:block">
        <div className="absolute inset-0 opacity-20">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <span className="text-xl font-bold tracking-tight">EcoCity</span>
          </Link>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">A cleaner city,<br />one report at a time.</h2>
            <p className="max-w-md text-white/85">
              Smart Waste Management connects citizens, workers and administrators on a single sustainable platform.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { v: "12K+", l: "Reports" },
                { v: "98%", l: "Resolved" },
                { v: "240", l: "Workers" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <p className="text-2xl font-bold">{s.v}</p>
                  <p className="text-xs text-white/75">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/60">© 2026 EcoCity Initiative</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md p-8 shadow-soft">
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo className="h-9 w-9" />
            <span className="font-bold">EcoCity</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Sign in to manage your dashboard" : "Join the smart-city movement"}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label className="mb-2 block">Select role</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const active = role === r.id;
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition ${
                        active ? "border-primary bg-primary/10 text-primary shadow-soft" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <r.icon className="h-4 w-4" />
                      {r.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{roles.find((r) => r.id === role)?.desc}</p>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter full name" className="pl-9" />
                </div>
              </div>
            )}

            {mode === "register" && role === "worker" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" className="pl-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full address" className="pl-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" className="pl-3" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="swmCode">6 digit code from GMC</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="swmCode" type="text" value={swmCode} onChange={(e) => setSwmCode(e.target.value)} placeholder="123456" className="pl-9" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-hero text-white shadow-soft hover:opacity-95">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Register</Link></>
            ) : (
              <>Already have one? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
