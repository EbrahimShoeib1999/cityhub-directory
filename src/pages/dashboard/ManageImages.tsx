import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const ManageImages = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

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

        const { data: imagesData } = await supabase
          .from("shop_images")
          .select("*")
          .eq("shop_id", shopData.id)
          .order("display_order");

        if (imagesData) {
          setImages(imagesData);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleAddImage = async () => {
    if (!newImageUrl.trim() || !shop) return;

    setUploading(true);
    try {
      const { error } = await supabase.from("shop_images").insert({
        shop_id: shop.id,
        image_url: newImageUrl,
        display_order: images.length,
      });

      if (error) throw error;

      // Refresh images
      const { data: updatedImages } = await supabase
        .from("shop_images")
        .select("*")
        .eq("shop_id", shop.id)
        .order("display_order");

      if (updatedImages) {
        setImages(updatedImages);
      }

      setNewImageUrl("");
      toast({
        title: "تمت الإضافة / Added",
        description: "تمت إضافة الصورة بنجاح / Image added successfully",
      });
    } catch (error: any) {
      toast({
        title: "خطأ / Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from("shop_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      setImages(images.filter((img) => img.id !== imageId));
      toast({
        title: "تم الحذف / Deleted",
        description: "تم حذف الصورة بنجاح / Image deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "خطأ / Error",
        description: error.message,
        variant: "destructive",
      });
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

  if (!shop) {
    return (
      <DashboardLayout>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
          <h1 className="text-3xl font-bold mb-2">إدارة الصور / Manage Images</h1>
          <p className="text-muted-foreground">
            أضف وحذف صور محلك / Add and delete your shop images
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>إضافة صورة جديدة / Add New Image</CardTitle>
            <CardDescription>
              الصق رابط الصورة أو استخدم صورة من الإنترنت / Paste image URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                disabled={uploading}
              />
              <Button onClick={handleAddImage} disabled={uploading || !newImageUrl.trim()}>
                {uploading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  <>
                    <Upload className="ml-2 h-4 w-4" />
                    إضافة / Add
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>معرض الصور / Image Gallery</CardTitle>
            <CardDescription>
              {images.length} صورة / {images.length} images
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  لم تضف أي صور بعد / No images added yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group rounded-lg overflow-hidden border border-border">
                    <img
                      src={image.image_url}
                      alt="Shop"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageImages;
