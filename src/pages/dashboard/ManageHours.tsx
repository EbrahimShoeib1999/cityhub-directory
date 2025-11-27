import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Loader2, Clock } from "lucide-react";

const DAYS = [
  { value: 0, name_ar: "الأحد", name_en: "Sunday" },
  { value: 1, name_ar: "الاثنين", name_en: "Monday" },
  { value: 2, name_ar: "الثلاثاء", name_en: "Tuesday" },
  { value: 3, name_ar: "الأربعاء", name_en: "Wednesday" },
  { value: 4, name_ar: "الخميس", name_en: "Thursday" },
  { value: 5, name_ar: "الجمعة", name_en: "Friday" },
  { value: 6, name_ar: "السبت", name_en: "Saturday" },
];

const ManageHours = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [hours, setHours] = useState<any[]>([]);

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

        const { data: hoursData } = await supabase
          .from("working_hours")
          .select("*")
          .eq("shop_id", shopData.id)
          .order("day_of_week");

        // Initialize with existing data or default values
        const initialHours = DAYS.map((day) => {
          const existing = hoursData?.find((h) => h.day_of_week === day.value);
          return existing || {
            day_of_week: day.value,
            shop_id: shopData.id,
            open_time: "09:00",
            close_time: "18:00",
            is_closed: false,
          };
        });

        setHours(initialHours);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!shop) return;

    setSaving(true);
    try {
      // Delete existing hours
      await supabase.from("working_hours").delete().eq("shop_id", shop.id);

      // Insert new hours
      const { error } = await supabase.from("working_hours").insert(
        hours.map((h) => ({
          shop_id: shop.id,
          day_of_week: h.day_of_week,
          open_time: h.is_closed ? null : h.open_time,
          close_time: h.is_closed ? null : h.close_time,
          is_closed: h.is_closed,
        }))
      );

      if (error) throw error;

      toast({
        title: "تم الحفظ / Saved",
        description: "تم حفظ ساعات العمل بنجاح / Working hours saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "خطأ / Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateHour = (dayIndex: number, field: string, value: any) => {
    setHours(
      hours.map((h, i) =>
        i === dayIndex ? { ...h, [field]: value } : h
      )
    );
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
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
          <h1 className="text-3xl font-bold mb-2">ساعات العمل / Working Hours</h1>
          <p className="text-muted-foreground">
            حدد أوقات العمل لكل يوم / Set working hours for each day
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>جدول ساعات العمل / Working Hours Schedule</CardTitle>
            <CardDescription>
              اضبط أوقات الفتح والإغلاق / Set opening and closing times
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {DAYS.map((day, index) => {
              const dayHour = hours[index];
              return (
                <div
                  key={day.value}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {day.name_ar} / {day.name_en}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!dayHour?.is_closed}
                        onCheckedChange={(checked) =>
                          updateHour(index, "is_closed", !checked)
                        }
                      />
                      <Label className="text-sm">
                        {dayHour?.is_closed ? "مغلق / Closed" : "مفتوح / Open"}
                      </Label>
                    </div>

                    {!dayHour?.is_closed && (
                      <>
                        <Input
                          type="time"
                          value={dayHour?.open_time || "09:00"}
                          onChange={(e) =>
                            updateHour(index, "open_time", e.target.value)
                          }
                          className="w-32"
                        />
                        <span>-</span>
                        <Input
                          type="time"
                          value={dayHour?.close_time || "18:00"}
                          onChange={(e) =>
                            updateHour(index, "close_time", e.target.value)
                          }
                          className="w-32"
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ... / Saving...
                </>
              ) : (
                "حفظ التغييرات / Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageHours;
