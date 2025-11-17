-- Add urgency column to complaints table
CREATE TYPE complaint_urgency AS ENUM ('Low', 'Normal', 'High', 'Critical');

ALTER TABLE complaints 
ADD COLUMN urgency complaint_urgency NOT NULL DEFAULT 'Normal';