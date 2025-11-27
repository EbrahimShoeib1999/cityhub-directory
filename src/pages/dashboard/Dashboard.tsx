import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Star, MessageSquare, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    viewCount: 0,
    reviewCount: 0,
    rating: 0,
    shopName: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopStats = async () => {
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (shop) {
        setStats({
          viewCount: shop.view_count || 0,
          reviewCount: shop.review_count || 0,
          rating: shop.rating || 0,
          shopName: shop.name_ar || shop.name_en,
        });
      }
      setLoading(false);
    };

    fetchShopStats();
  }, [user]);

  const statCards = [
    {
      title: "المشاهدات / Views",
      value: stats.viewCount,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "التقييم / Rating",
      value: stats.rating.toFixed(1),
      icon: Star,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "التعليقات / Reviews",
      value: stats.reviewCount,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "النمو / Growth",
      value: "+12%",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">مرحباً بك / Welcome</h1>
          <p className="text-muted-foreground">
            {stats.shopName || "أنشئ محلك الآن / Create your shop now"}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-24 animate-pulse bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat, index) => (
              <Card key={index} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>نصائح سريعة / Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-accent rounded-lg">
              <div className="p-2 bg-primary rounded-lg mt-0.5">
                <Star className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">أكمل معلومات محلك / Complete your shop info</h3>
                <p className="text-sm text-muted-foreground">
                  المحلات المكتملة تحصل على مشاهدات أكثر بنسبة 70% / Complete shops get 70% more views
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-accent rounded-lg">
              <div className="p-2 bg-primary rounded-lg mt-0.5">
                <Eye className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">أضف صور عالية الجودة / Add high-quality images</h3>
                <p className="text-sm text-muted-foreground">
                  الصور الواضحة تزيد من ثقة العملاء / Clear images increase customer trust
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
