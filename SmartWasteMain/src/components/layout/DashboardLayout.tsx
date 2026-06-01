import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Map, Users, ClipboardList, LogOut, Bell, Menu, Award, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import UserProfile from "@/components/dashboard/UserProfile";
import { reportsApi, type ApiReport, type ApiUser } from "@/api/client";

const navByRole = {
  user: [
    { title: "Overview", url: "/user", icon: LayoutDashboard },
    { title: "Report Waste", url: "/user/report", icon: FileText },
    { title: "My Reports", url: "/user/reports", icon: ClipboardList },
    { title: "Report Map", url: "/user/map", icon: Map },
  ],
  admin: [
    { title: "Overview", url: "/admin", icon: LayoutDashboard },
    { title: "Manage Reports", url: "/admin/reports", icon: ClipboardList },
    { title: "Workers", url: "/admin/workers", icon: Users },
    { title: "City Map", url: "/admin/map", icon: Map },
  ],
  worker: [
    { title: "Overview", url: "/worker", icon: LayoutDashboard },
    { title: "My Tasks", url: "/worker/tasks", icon: ClipboardList },
    { title: "Route Map", url: "/worker/map", icon: Map },
    { title: "Eco-Rewards", url: "/worker/rewards", icon: Award },
  ],
};

import Logo from "@/components/ui/Logo";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: string;
  tone: "primary" | "warning" | "success";
}

const shortId = (id: string) => id.slice(-6).toUpperCase();

const getPersonName = (person?: string | ApiUser) => {
  if (!person) return "a worker";
  return typeof person === "string" ? "a worker" : person.name;
};

const getPersonId = (person?: string | ApiUser) => {
  if (!person) return "";
  return typeof person === "string" ? person : person._id;
};

const readNotificationsKey = (userId: string) => `smartwaste:read-notifications:${userId}`;

function buildNotifications(role: string, reports: ApiReport[]): NotificationItem[] {
  if (role === "admin") {
    return reports
      .filter((report) => report.status === "pending")
      .map((report) => ({
        id: `admin:${report._id}:pending`,
        title: "New report needs assignment",
        description: `${shortId(report._id)} at ${report.location}`,
        href: "/admin/reports",
        createdAt: report.createdAt,
        tone: "warning",
      }));
  }

  if (role === "worker") {
    return reports
      .filter((report) => report.status !== "completed")
      .map((report) => ({
        id: `worker:${report._id}:${report.status}`,
        title: "Task assigned to you",
        description: `${shortId(report._id)} at ${report.location}`,
        href: "/worker/tasks",
        createdAt: report.createdAt,
        tone: "primary",
      }));
  }

  return reports
    .filter((report) => report.status !== "pending")
    .map((report) => ({
      id: `user:${report._id}:${report.status}:${getPersonId(report.assignedTo)}`,
      title: report.status === "completed" ? "Your report is completed" : "Your report was assigned",
      description: report.status === "completed"
        ? `${shortId(report._id)} at ${report.location} is done`
        : `${shortId(report._id)} was assigned to ${getPersonName(report.assignedTo)}`,
      href: "/user/reports",
      createdAt: report.createdAt,
      tone: report.status === "completed" ? "success" : "primary",
    }));
}

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const initialized = useRef(false);
  const notificationIds = useRef<Set<string>>(new Set());
  const readIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    let storedIds: string[] = [];
    try {
      const stored = localStorage.getItem(readNotificationsKey(user.id));
      storedIds = stored ? JSON.parse(stored) as string[] : [];
    } catch (error) {
      console.error("Failed to parse read notifications:", error);
    }
    const nextReadIds = new Set(storedIds);
    setReadIds(nextReadIds);
    readIdsRef.current = nextReadIds;
    notificationIds.current = new Set();
    initialized.current = false;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadNotifications = async () => {
      try {
        const reports = await reportsApi.getAll(
          user.role === "admin"
            ? undefined
            : user.role === "worker"
              ? { assignedTo: user.id }
              : { reporter: user.id }
        );
        if (!active) return;

        const next = buildNotifications(user.role, reports);
        setNotifications(next);

        if (initialized.current) {
          const fresh = next.find((item) => !notificationIds.current.has(item.id) && !readIdsRef.current.has(item.id));
          if (fresh) toast.info(fresh.title, { description: fresh.description });
        } else {
          initialized.current = true;
        }
        notificationIds.current = new Set(next.map((item) => item.id));
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

  const unread = useMemo(
    () => notifications.filter((item) => !readIds.has(item.id)),
    [notifications, readIds]
  );

  const saveReadIds = (ids: Set<string>) => {
    if (!user) return;
    setReadIds(ids);
    readIdsRef.current = ids;
    localStorage.setItem(readNotificationsKey(user.id), JSON.stringify([...ids]));
  };

  const openNotification = (item: NotificationItem) => {
    const next = new Set(readIds);
    next.add(item.id);
    saveReadIds(next);
    navigate(item.href);
  };

  const markAllRead = () => {
    saveReadIds(new Set([...readIds, ...notifications.map((item) => item.id)]));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{unread.length} unread</p>
          </div>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={notifications.length === 0}>
            Mark read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              const unreadItem = !readIds.has(item.id);
              const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "warning" ? AlertTriangle : Bell;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openNotification(item)}
                  className="flex w-full gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-muted/60"
                >
                  <span className={`mt-0.5 rounded-full p-1.5 ${item.tone === "success" ? "bg-success/15 text-success" : item.tone === "warning" ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium">{item.title}</span>
                      {unreadItem && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-destructive" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{item.description}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  if (!user) return null;
  const items = navByRole[user.role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-9 w-9" />
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">EcoCity</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role} Portal</p>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to log out of your session. You will need to sign back in to access your dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { logout(); toast.success("Signed out"); navigate("/login"); }}
              >
                Log out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({ children, title }: { children: ReactNode; title: string }) {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <SidebarProvider>
      <UserProfile open={profileOpen} onOpenChange={setProfileOpen} />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur px-4 md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger><Menu className="h-5 w-5" /></SidebarTrigger>
              <h1 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {(user?.role === 'user' || user?.role === 'worker') && (
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 border border-primary/20 shadow-glow animate-pulse-glow">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{user?.points || 0} <span className="hidden sm:inline">pts</span></span>
                </div>
              )}
              <NotificationBell />
              <div 
                className="hidden items-center gap-2 md:flex cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setProfileOpen(true)}
              >
                <Avatar className="h-9 w-9 border border-primary/20">
                  <AvatarFallback className="bg-gradient-hero text-white text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 animate-fade-in">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
