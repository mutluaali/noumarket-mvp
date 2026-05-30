-- NouMarket listing rejection reason
-- Stores the admin moderation note shown to the seller when a listing is rejected.
-- Safe to run more than once.

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS rejected_reason text;
