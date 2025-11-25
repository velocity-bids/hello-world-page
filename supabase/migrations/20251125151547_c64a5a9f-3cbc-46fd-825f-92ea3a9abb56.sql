-- Add new vehicle history and condition columns
ALTER TABLE vehicles
ADD COLUMN imported BOOLEAN DEFAULT false,
ADD COLUMN import_country TEXT,
ADD COLUMN maintenance_book BOOLEAN DEFAULT false,
ADD COLUMN smoker BOOLEAN DEFAULT false,
ADD COLUMN number_of_owners INTEGER;