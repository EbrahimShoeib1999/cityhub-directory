import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  Images,
  Clock,
  Crown,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم / Dashboard", href: "/dashboard" },
    { icon: Store, label: "إدارة المحل / Manage Shop", href: "/dashboard/shop" },
    { icon: Images, label: "الصور / Images", href: "/dashboard/images" },
    { icon: Clock, label: "ساعات العمل / Hours", href: "/dashboard/hours" },
    { icon: Crown, label: "الباقات / Premium", href: "/dashboard/premium" },
    { icon: User, label: "الملف الشخصي / Profile", href: "/dashboard/profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">CityHub</h2>
            <p className="text-xs text-muted-foreground">دمياط الجديدة</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <item.icon className="h-5 w-5 ml-3" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="h-5 w-5 ml-3" />
          تسجيل الخروج / Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-l border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold">CityHub</h2>
                <p className="text-xs text-muted-foreground">دمياط الجديدة</p>
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
