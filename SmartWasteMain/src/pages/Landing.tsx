import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Recycle, Users, Shield, Truck, ArrowRight, Leaf, MapPin, BarChart3, Loader2, Award, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight">EcoCity</span>
        </Link>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="hidden sm:flex text-primary font-medium hover:bg-primary/10">Eco Points</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl"><Award className="h-6 w-6 text-primary" /> Eco Points System</DialogTitle>
                <DialogDescription>
                  Learn how you can earn rewards while helping keep our city clean.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-primary/10 p-2 rounded-full text-primary mt-1"><FileText className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-bold">Report Waste</h4>
                    <p className="text-sm text-muted-foreground">Earn <span className="font-bold text-primary">20 points</span> for every valid waste report you submit with a photo and location.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-success/10 p-2 rounded-full text-success mt-1"><CheckCircle2 className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-bold">Resolution Bonus</h4>
                    <p className="text-sm text-muted-foreground">Earn an additional <span className="font-bold text-success">50 points</span> when your reported waste is successfully cleaned up by our workers.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="bg-warning/10 p-2 rounded-full text-warning mt-1"><Award className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-bold">Redeem Rewards</h4>
                    <p className="text-sm text-muted-foreground">Exchange points for bus pass discounts, local cafe vouchers, or plant a tree in your name!</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {user ? (
            <Button
              className="bg-gradient-hero text-white"
              onClick={() => navigate(`/${user.role}`)}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  setLoadingLogin(true);
                  setTimeout(() => navigate("/login"), 120);
                }}
                disabled={loadingLogin}
              >
                {loadingLogin ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sign in
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
              <Button
                className="bg-gradient-hero text-white"
                onClick={() => {
                  setLoadingRegister(true);
                  setTimeout(() => navigate("/register"), 120);
                }}
                disabled={loadingRegister}
              >
                {loadingRegister ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Get started
                  </span>
                ) : (
                  "Get started"
                )}
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Leaf className="h-3 w-3" /> Smart City Initiative
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
            Smarter waste, <span className="bg-gradient-text">cleaner cities.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Report, route and resolve waste issues across your city — all from one beautifully simple platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Button asChild size="lg" className="bg-gradient-hero text-white shadow-glow">
                <Link to={`/${user.role}`}>Launch dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="bg-gradient-hero text-white shadow-glow">
                  <Link to="/register">Launch dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg"><Link to="/login">Sign in</Link></Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Users, title: "For Citizens", desc: "Report overflowing bins or hazardous waste with photos and live location." },
            { icon: Shield, title: "For Admins", desc: "Monitor city-wide stats, assign workers and resolve faster." },
            { icon: Truck, title: "For Workers", desc: "See assigned tasks on a map and update status on the go." },
          ].map((f) => (
            <Card key={f.title} className="bg-gradient-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BarChart3, v: "12,480", l: "Reports filed" },
            { icon: MapPin, v: "3,210", l: "Bins tracked" },
            { icon: Leaf, v: "98%", l: "Resolution rate" },
          ].map((s) => (
            <div key={s.l} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.v}</p>
                <p className="text-xs text-muted-foreground">{s.l}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 border-t border-border/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Our Impact in Action</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From smart sensors to community action, see how we're making cities cleaner and more sustainable every day.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { url: "https://images.unsplash.com/photo-1518005020251-58296d87baac?q=80&w=800&auto=format&fit=crop", title: "Smart Collection", desc: "Optimized routes for cleaner streets." },
            { url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop", title: "Recycling Hubs", desc: "Advanced sorting for maximum recovery." },
            { url: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?q=80&w=800&auto=format&fit=crop", title: "Green Spaces", desc: "Restoring nature in urban centers." },
            { url: "https://images.unsplash.com/photo-1605600611284-195205ef9196?q=80&w=800&auto=format&fit=crop", title: "Zero Waste Events", desc: "Community cleanup and awareness." }
          ].map((img, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl aspect-[4/5] card-hover">
              <img 
                src={img.url} 
                alt={img.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-white font-bold text-lg">{img.title}</h4>
                <p className="text-white/80 text-sm">{img.desc}</p>
              </div>
              <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                Achievement
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © 2026 EcoCity — Smart Waste Management.
      </footer>
    </div>
  );
}
