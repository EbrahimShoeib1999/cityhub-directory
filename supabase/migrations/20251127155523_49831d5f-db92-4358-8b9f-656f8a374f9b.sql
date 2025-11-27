-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'shop_owner', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  cover_image TEXT,
  phone TEXT,
  whatsapp TEXT,
  address_ar TEXT,
  address_en TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  is_premium BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Create shop_images table
CREATE TABLE public.shop_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shop_images ENABLE ROW LEVEL SECURITY;

-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  UNIQUE (shop_id, day_of_week)
);

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- Create premium_plans table
CREATE TABLE public.premium_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;

-- Create shop_premium_subscriptions table
CREATE TABLE public.shop_premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.premium_plans(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shop_premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Profiles: Users can view all profiles, but only update their own
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- User roles: Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Categories: Everyone can view, admins can manage
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Shops: Everyone can view approved shops, owners can manage their own
CREATE POLICY "Approved shops are viewable by everyone"
  ON public.shops FOR SELECT
  USING (is_approved = true OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shop owners can create shops"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'shop_owner'));

CREATE POLICY "Shop owners can update their own shops"
  ON public.shops FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shops"
  ON public.shops FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Shop images: Viewable by all, manageable by shop owners
CREATE POLICY "Shop images are viewable by everyone"
  ON public.shop_images FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can insert images for their shops"
  ON public.shop_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = shop_images.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can update their shop images"
  ON public.shop_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = shop_images.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can delete their shop images"
  ON public.shop_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = shop_images.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Working hours: Viewable by all, manageable by shop owners
CREATE POLICY "Working hours are viewable by everyone"
  ON public.working_hours FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can manage working hours"
  ON public.working_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = working_hours.shop_id
      AND shops.owner_id = auth.uid()
    )
  );

-- Premium plans: Viewable by all, manageable by admins
CREATE POLICY "Premium plans are viewable by everyone"
  ON public.premium_plans FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage premium plans"
  ON public.premium_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Shop premium subscriptions: Viewable by shop owners and admins
CREATE POLICY "Shop owners can view their subscriptions"
  ON public.shop_premium_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = shop_premium_subscriptions.shop_id
      AND (shops.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Reviews: Everyone can view, users can create/update their own
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Insert default categories
INSERT INTO public.categories (name_ar, name_en, slug, icon) VALUES
  ('الأثاث', 'Furniture', 'furniture', '🪑'),
  ('المطاعم', 'Restaurants', 'restaurants', '🍽️'),
  ('الإلكترونيات', 'Electronics', 'electronics', '📱'),
  ('الملابس', 'Clothing', 'clothing', '👔'),
  ('الخدمات', 'Services', 'services', '🛠️'),
  ('المحلات التجارية', 'Shops', 'shops', '🏪');

-- Insert default premium plans
INSERT INTO public.premium_plans (name_ar, name_en, duration_days, price, features) VALUES
  ('باقة شهرية', 'Monthly Plan', 30, 100.00, '["Featured listing", "Priority support", "Analytics"]'),
  ('باقة 3 أشهر', '3-Month Plan', 90, 250.00, '["Featured listing", "Priority support", "Analytics", "10% discount"]'),
  ('باقة سنوية', 'Annual Plan', 365, 900.00, '["Featured listing", "Priority support", "Analytics", "25% discount"]');