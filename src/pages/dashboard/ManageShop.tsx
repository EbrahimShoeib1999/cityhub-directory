import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Loader2 } from "lucide-react";

const ManageShop = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [formData, setFormData] = useState({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    category_id: "",
    phone: "",
    whatsapp: "",
    address_ar: "",
    address_en: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("name_en");
      
      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shopData) {
        setShop(shopData);
        setFormData({
          name_ar: shopData.name_ar || "",
          name_en: shopData.name_en || "",
          description_ar: shopData.description_ar || "",
          description_en: shopData.description_en || "",
          category_id: shopData.category_id || "",
          phone: shopData.phone || "",
          whatsapp: shopData.whatsapp || "",
          address_ar: shopData.address_ar || "",
          address_en: shopData.address_en || "",
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (shop) {
        // Update existing shop
        const { error } = await supabase
          .from("shops")
          .update({
            ...formData,
            slug: formData.name_en.toLowerCase().replace(/\s+/g, "-"),
          })
          .eq("id", shop.id);

        if (error) throw error;

        toast({
          title: "تم التحديث / Updated",
          description: "تم تحديث بيانات المحل بنجاح / Shop updated successfully",
        });
      } else {
        // Create new shop
        const { error } = await supabase.from("shops").insert({
          ...formData,
          owner_id: user?.id,
          slug: formData.name_en.toLowerCase().replace(/\s+/g, "-"),
          is_approved: false,
        });

        if (error) throw error;

        toast({
          title: "تم الإنشاء / Created",
          description: "تم إنشاء المحل بنجاح / Shop created successfully. في انتظار الموافقة / Pending approval",
        });

        // Refresh data
        const { data: newShop } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user?.id)
          .single();
        
        setShop(newShop);
      }
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">إدارة المحل / Manage Shop</h1>
          <p className="text-muted-foreground">
            {shop ? "تحديث بيانات المحل / Update shop details" : "إنشاء محل جديد / Create new shop"}
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>معلومات المحل / Shop Information</CardTitle>
            <CardDescription>
              املأ جميع الحقول بدقة / Fill all fields accurately
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">اسم المحل (عربي) / Shop Name (Arabic)</Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    required
                    placeholder="مثال: محل الأثاث الحديث"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">Shop Name (English)</Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    required
                    placeholder="Example: Modern Furniture Store"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة / Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة / Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name_ar} / {category.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description_ar">الوصف (عربي) / Description (Arabic)</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={4}
                    placeholder="اكتب وصفاً تفصيلياً عن محلك..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description (English)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    rows={4}
                    placeholder="Write a detailed description about your shop..."
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف / Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+20 123 456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">واتساب / WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+20 123 456 7890"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address_ar">العنوان (عربي) / Address (Arabic)</Label>
                  <Input
                    id="address_ar"
                    value={formData.address_ar}
                    onChange={(e) => setFormData({ ...formData, address_ar: e.target.value })}
                    placeholder="شارع ... - دمياط الجديدة"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_en">Address (English)</Label>
                  <Input
                    id="address_en"
                    value={formData.address_en}
                    onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                    placeholder="Street ... - New Damietta"
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full md:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ... / Saving...
                  </>
                ) : (
                  "حفظ / Save"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageShop;
