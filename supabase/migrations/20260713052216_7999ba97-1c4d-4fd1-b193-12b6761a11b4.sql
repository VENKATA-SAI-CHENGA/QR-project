
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: own read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: own update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- QR codes
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'url',
  is_dynamic BOOLEAN NOT NULL DEFAULT true,
  target_url TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  fg_color TEXT NOT NULL DEFAULT '#0A0A0F',
  bg_color TEXT NOT NULL DEFAULT '#FFFFFF',
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;
GRANT SELECT ON public.qr_codes TO anon;
GRANT ALL ON public.qr_codes TO service_role;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR: owner all" ON public.qr_codes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "QR: public read active" ON public.qr_codes FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "QR: auth read active" ON public.qr_codes FOR SELECT TO authenticated USING (is_active = true OR auth.uid() = user_id);
CREATE INDEX qr_codes_user_id_idx ON public.qr_codes(user_id);
CREATE INDEX qr_codes_slug_idx ON public.qr_codes(slug);

-- QR scans
CREATE TABLE public.qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  ip_hash TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.qr_scans TO authenticated;
GRANT INSERT ON public.qr_scans TO anon, authenticated;
GRANT ALL ON public.qr_scans TO service_role;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scans: owner read" ON public.qr_scans FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.qr_codes q WHERE q.id = qr_code_id AND q.user_id = auth.uid()));
CREATE POLICY "Scans: public insert" ON public.qr_scans FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX qr_scans_qr_code_id_idx ON public.qr_scans(qr_code_id);
CREATE INDEX qr_scans_scanned_at_idx ON public.qr_scans(scanned_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment scan_count RPC
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.qr_codes SET scan_count = scan_count + 1 WHERE id = qr_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_scan_count(UUID) TO anon, authenticated;
