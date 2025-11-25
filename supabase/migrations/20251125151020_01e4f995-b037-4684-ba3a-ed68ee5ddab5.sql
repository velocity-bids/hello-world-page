-- Add new vehicle specification columns
ALTER TABLE vehicles
ADD COLUMN horsepower INTEGER,
ADD COLUMN engine_type TEXT,
ADD COLUMN exterior_color TEXT,
ADD COLUMN interior_color TEXT,
ADD COLUMN engine_displacement INTEGER,
ADD COLUMN fuel_type TEXT,
ADD COLUMN transmission TEXT,
ADD COLUMN doors INTEGER;