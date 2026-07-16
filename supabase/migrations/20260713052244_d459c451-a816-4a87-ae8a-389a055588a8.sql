
-- Restrict trigger function exec
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Rewrite increment as SECURITY INVOKER against active QRs only
DROP FUNCTION IF EXISTS public.increment_scan_count(UUID);
CREATE OR REPLACE FUNCTION public.increment_scan_count(qr_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.qr_codes SET scan_count = scan_count + 1 WHERE id = qr_id AND is_active = true;
$$;
GRANT EXECUTE ON FUNCTION public.increment_scan_count(UUID) TO anon, authenticated;

-- Also allow anon to UPDATE scan_count column via the function above (RLS needs a policy)
CREATE POLICY "QR: increment scans" ON public.qr_codes FOR UPDATE TO anon, authenticated
  USING (is_active = true) WITH CHECK (is_active = true);

-- Tighten scan insert: require referenced QR exists and is active
DROP POLICY IF EXISTS "Scans: public insert" ON public.qr_scans;
CREATE POLICY "Scans: insert if qr active" ON public.qr_scans FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.qr_codes q WHERE q.id = qr_code_id AND q.is_active = true));
