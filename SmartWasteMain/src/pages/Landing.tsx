import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiCall } from "@/api/client";
import { Recycle, Users, Shield, Truck, ArrowRight, Leaf, MapPin, BarChart3, Loader2, Award, FileText, CheckCircle2, Mail, Phone } from "lucide-react";
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
  
  const [stats, setStats] = useState({ reports: "12,480", bins: "3,210", resolved: "98%" });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await apiCall<{ reports: number; resolved: string; workers: number; bins: number }>("/stats");
        setStats({
          reports: data.reports.toString(),
          resolved: data.resolved,
          bins: data.bins.toString()
        });
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    };
    loadStats();
  }, []);
  return (
    <div className="min-h-screen bg-background">
      <div className="relative border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.jpg" alt="Cityscape" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10">
          <header className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-9 w-9 text-white" />
              <span className="text-lg font-bold tracking-tight text-white">EcoCity</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                className="hidden sm:flex text-white font-medium hover:bg-white/20 hover:text-white"
                onClick={() => {
                  document.getElementById('who-we-are')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Who We Are
              </Button>
              <Button 
                variant="ghost" 
                className="hidden sm:flex text-white font-medium hover:bg-white/20 hover:text-white"
                onClick={() => {
                  document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Contact Us
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="hidden sm:flex text-white font-medium hover:bg-white/20 hover:text-white">Eco Points</Button>
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
                    className="text-white hover:bg-white/20 hover:text-white"
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md shadow-soft">
                <Leaf className="h-3 w-3 text-emerald-400" /> A new way to keep our streets clean
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl text-white">
                Smarter waste, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">cleaner cities.</span>
              </h1>
              <p className="mt-5 text-lg text-white/90 max-w-2xl mx-auto">
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
                    <Button asChild variant="outline" size="lg" className="bg-white/10 backdrop-blur-md text-white border-white/50 hover:bg-white hover:text-emerald-900 shadow-soft transition-all"><Link to="/login">Sign in</Link></Button>
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
                { icon: BarChart3, v: stats.reports, l: "Reports filed" },
                { icon: MapPin, v: stats.bins, l: "Bins tracked" },
                { icon: Leaf, v: stats.resolved, l: "Resolution rate" },
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
        </div>
      </div>

      <section className="container py-16 border-t border-border/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Our Impact in Action</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From smart sensors to community action, see how we're making cities cleaner and more sustainable every day.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
          {[
            { url: "/gallery/katie-rodriguez-qsVWEGNnIrM-unsplash.jpg", title: "Landfill Reduction", span: "col-span-2 row-span-2" },
            { url: "/gallery/gettyimages-1288605209-612x612.jpg", title: "Street Cleaning", span: "col-span-1 row-span-1" },
            { url: "/gallery/gettyimages-458637337-612x612.jpg", title: "Active Waste Collection", span: "col-span-1 row-span-2" },
            { url: "/gallery/gettyimages-476855334-612x612.jpg", title: "Community Engagement", span: "col-span-1 row-span-1" },
            { url: "/gallery/gettyimages-900379516-612x612.jpg", title: "Waste Segregation", span: "col-span-2 row-span-1" },
            { url: "/gallery/gettyimages-900379602-612x612.jpg", title: "Dumpster Compaction", span: "col-span-1 row-span-1" },
            { url: "/gallery/istockphoto-1487944822-612x612.jpg", title: "Park Maintenance", span: "col-span-1 row-span-1" }
          ].map((img, idx) => (
            <div key={idx} className={`group relative overflow-hidden rounded-2xl shadow-soft transition-all duration-300 hover:shadow-glow ${img.span}`}>
              <img 
                src={img.url} 
                alt={img.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h4 className="text-white font-bold text-lg md:text-xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{img.title}</h4>
                <div className="w-10 h-1 bg-primary rounded-full transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 delay-100"></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="who-we-are" className="container py-16 md:py-24 border-t border-border/50 scroll-m-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Who We Are</h2>
          
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-soft border border-border/50 relative overflow-hidden text-left">
            {/* Decorative background element to highlight the box */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10 space-y-6">
              <p className="text-lg md:text-xl text-foreground leading-relaxed font-medium">
                We're just a group of people who got tired of walking past overflowing trash bins and littered streets in our own neighborhoods. 
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                When we looked closely at the problem, we realized it wasn't just that there was too much waste. The real issue was a massive disconnect. People walking by the trash had no quick way to report it, and the hardworking sanitation teams didn't know exactly where they were needed most on any given day. 
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Instead of complaining, we decided to build a bridge. We created EcoCity to give every person in our community a voice—allowing anyone to simply snap a photo of a problem and instantly send it to the exact workers who can fix it. By giving people a simple tool, we're helping neighbors and city workers team up to take care of the places we call home.
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-lg font-bold text-primary">
              No buzzwords, just cleaner streets.
            </p>
          </div>
        </div>
      </section>

      <section id="contact-us" className="container py-16 border-t border-border/50 scroll-m-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">Contact Us</h2>
          
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full text-primary mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground">khagembasapam11@gov.in</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full text-primary mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Office</h3>
              <p className="text-sm text-muted-foreground">Panikhaiti, Kamrup<br />Assam, 781026</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-soft border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full text-primary mb-4">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="font-bold mb-1">Phone</h3>
              <p className="text-sm text-muted-foreground">+91 9366475118<br />Mon-Fri, 9am-5pm</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
        <span>© 2026 EcoCity — Smart Waste Management.</span>
        <Link to="/login?admin=true" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">Admin login</Link>
      </footer>
    </div>
  );
}
