import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Loader2, Crown, Check } from "lucide-react";

const ManagePremium = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shopData) {
        setShop(shopData);

        // Fetch premium plans
        const { data: plansData } = await supabase
          .from("premium_plans")
          .select("*")
          .eq("is_active", true)
          .order("price");

        if (plansData) {
          setPlans(plansData);
        }

        // Fetch active subscription
        const { data: subData } = await supabase
          .from("shop_premium_subscriptions")
          .select("*, premium_plans(*)")
          .eq("shop_id", shopData.id)
          .eq("is_active", true)
          .gte("end_date", new Date().toISOString())
          .maybeSingle();

        if (subData) {
          setSubscription(subData);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSubscribe = async (planId: string) => {
    if (!shop) return;

    toast({
      title: "قريباً / Coming Soon",
      description: "ستتم إضافة نظام الدفع قريباً / Payment system will be added soon",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!shop) {
    return (
      <DashboardLayout>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">لا يوجد محل / No Shop Found</p>
              <p className="text-muted-foreground mb-4">
                يجب إنشاء محل أولاً / You need to create a shop first
              </p>
              <Button onClick={() => window.location.href = "/dashboard/shop"}>
                إنشاء محل / Create Shop
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">الباقات المميزة / Premium Plans</h1>
          <p className="text-muted-foreground">
            اختر باقة لتحسين ظهور محلك / Choose a plan to boost your shop
          </p>
        </div>

        {subscription && (
          <Card className="border-border bg-accent">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    <p className="font-bold">باقتك الحالية / Current Plan</p>
                  </div>
                  <p className="text-xl font-semibold mb-1">
                    {subscription.premium_plans.name_ar} / {subscription.premium_plans.name_en}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    تنتهي في / Expires on: {new Date(subscription.end_date).toLocaleDateString("ar-EG")}
                  </p>
                </div>
                <Badge variant="secondary">نشط / Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const features = JSON.parse(plan.features || "[]");
            return (
              <Card key={plan.id} className="border-border relative">
                {plan.duration_days === 365 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-600 text-white">الأفضل / Best Value</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>
                    {plan.name_ar}
                    <br />
                    <span className="text-base font-normal text-muted-foreground">
                      {plan.name_en}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price} ج.م
                    </span>
                    <span className="text-sm"> / {plan.duration_days} يوم</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full"
                    variant={subscription?.plan_id === plan.id ? "secondary" : "default"}
                    disabled={subscription?.plan_id === plan.id}
                  >
                    {subscription?.plan_id === plan.id
                      ? "باقتك الحالية / Current"
                      : "اشترك الآن / Subscribe"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagePremium;
