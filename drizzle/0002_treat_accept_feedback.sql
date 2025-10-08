-- Add acceptance/decline timestamps and optional feedback note for treats
ALTER TABLE treat ADD COLUMN accepted_at INTEGER;
ALTER TABLE treat ADD COLUMN declined_at INTEGER;
ALTER TABLE treat ADD COLUMN feedback_note TEXT;

