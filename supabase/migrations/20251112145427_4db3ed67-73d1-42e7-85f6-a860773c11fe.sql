-- Convert category column to text temporarily
ALTER TABLE complaints ALTER COLUMN category TYPE text;

-- Update existing data to use new category names
UPDATE complaints SET category = 'Communication' WHERE category = 'Technical';
UPDATE complaints SET category = 'Payments' WHERE category = 'Financial';
UPDATE complaints SET category = 'Others' WHERE category IN ('Mentor', 'Infrastructure', 'Other');
UPDATE complaints SET category = 'Hub' WHERE category = 'Hostel';

-- Drop old enum and create new one
DROP TYPE complaint_category;
CREATE TYPE complaint_category AS ENUM ('Communication', 'Hub', 'Review', 'Payments', 'Others');

-- Convert column back to the new enum
ALTER TABLE complaints 
  ALTER COLUMN category TYPE complaint_category 
  USING category::complaint_category;