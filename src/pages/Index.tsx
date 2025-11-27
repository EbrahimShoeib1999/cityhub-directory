import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary rounded-2xl">
            <Store className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>
        <h1 className="mb-4 text-5xl font-bold">
          CityHub
          <br />
          <span className="text-3xl text-muted-foreground">دمياط الجديدة</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          دليل المحلات والخدمات المحلية
          <br />
          Local Shops & Services Directory
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth/login">
            <Button size="lg" className="w-full sm:w-auto">
              تسجيل الدخول / Login
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/auth/register">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              إنشاء حساب / Register
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
