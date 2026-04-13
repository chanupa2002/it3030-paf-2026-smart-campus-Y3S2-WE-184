-- SQL script to clean up missing image references from tickets
-- Run this in your Supabase SQL editor or via psql

-- First, let's see which tickets have the missing files
SELECT ticket_id, images 
FROM tickets 
WHERE images LIKE '%8d343795-a9f7-4e5e-813c-f6531a8bd1db%'
   OR images LIKE '%07d33f14-cc7d-4a61-9da5-4c4829d28ebe%'
   OR images LIKE '%1be50b61-f877-48a1-aa52-4ac25f4479ad%';

-- To remove these missing file references, you need to update the JSONB array
-- This is a manual process - you'll need to identify which tickets have these files
-- and update them individually

-- Example for ticket #23 (replace with actual ticket_id):
-- UPDATE tickets 
-- SET images = '[]'::jsonb 
-- WHERE ticket_id = 23;

-- Or if the ticket has multiple images and you want to keep only the valid ones:
-- UPDATE tickets 
-- SET images = '["valid-url-1", "valid-url-2"]'::jsonb 
-- WHERE ticket_id = 23;
