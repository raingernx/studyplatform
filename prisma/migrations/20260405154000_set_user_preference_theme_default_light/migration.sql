-- Align UserPreference theme defaults with the app runtime baseline.
ALTER TABLE "UserPreference"
ALTER COLUMN "theme" SET DEFAULT 'light';
