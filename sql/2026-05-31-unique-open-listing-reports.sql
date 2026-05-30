-- NouMarket: enforce one active report per reporter + listing
-- Active statuses: open, reviewing
-- Safe to run more than once.

DO $$
DECLARE
  cleaned_count integer := 0;
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY reporter_id, listing_id
        ORDER BY created_at DESC, id DESC
      ) AS rn
    FROM public.listing_reports
    WHERE reporter_id IS NOT NULL
      AND status IN ('open', 'reviewing')
  ),
  updated AS (
    UPDATE public.listing_reports lr
    SET
      status = 'dismissed',
      admin_note = CASE
        WHEN COALESCE(trim(lr.admin_note), '') = '' THEN
          '[Otomatik birleştirme] Yinelenen aktif şikayet kapatıldı; en yeni kayıt korundu.'
        ELSE
          trim(lr.admin_note) || E'\n' || '[Otomatik birleştirme] Yinelenen aktif şikayet kapatıldı; en yeni kayıt korundu.'
      END,
      updated_at = now()
    FROM ranked r
    WHERE lr.id = r.id
      AND r.rn > 1
    RETURNING lr.id
  )
  SELECT count(*) INTO cleaned_count FROM updated;

  RAISE NOTICE 'listing_reports duplicate cleanup dismissed % row(s)', cleaned_count;
END $$;

DROP INDEX IF EXISTS public.idx_listing_reports_one_active_per_user_listing;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_reports_one_active_per_user_listing
  ON public.listing_reports (reporter_id, listing_id)
  WHERE reporter_id IS NOT NULL
    AND status IN ('open', 'reviewing');

NOTIFY pgrst, 'reload schema';
