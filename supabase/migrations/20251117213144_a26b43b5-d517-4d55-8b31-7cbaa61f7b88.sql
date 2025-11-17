-- Add starred column to complaints table
ALTER TABLE complaints 
ADD COLUMN starred boolean NOT NULL DEFAULT false;