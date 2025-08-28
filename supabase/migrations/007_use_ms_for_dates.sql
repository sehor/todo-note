-- supabase/migrations/007_use_ms_for_dates.sql

-- First, drop the foreign key constraint on recurring_template_id if it references a column that will be changed.
-- This step might be necessary if there are complex dependencies. In our case, it's safer to do so.
-- Note: The actual constraint name might differ. Check your DB schema if this fails.
-- ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_recurring_template_id_fkey;

-- Alter the due_date column
-- Change type to BIGINT to store milliseconds since epoch.
-- Existing values are converted from TIMESTAMP WITH TIME ZONE to milliseconds.
ALTER TABLE public.todos
ALTER COLUMN due_date TYPE BIGINT
USING (EXTRACT(EPOCH FROM due_date) * 1000);

-- Alter the start_date column
-- Change type to BIGINT to store milliseconds since epoch (representing the start of the day).
-- Existing values are converted from DATE to milliseconds.
ALTER TABLE public.todos
ALTER COLUMN start_date TYPE BIGINT
USING (EXTRACT(EPOCH FROM start_date) * 1000);

-- Update comments for clarity
COMMENT ON COLUMN public.todos.due_date IS 'Due date and time of the todo, stored as milliseconds since Unix epoch.';
COMMENT ON COLUMN public.todos.start_date IS 'Start date of the todo, stored as milliseconds since Unix epoch (representing the start of the day).';

-- Re-add foreign key constraint if it was dropped.
-- Make sure the referenced column in todo_recurring_templates is compatible.
-- ALTER TABLE public.todos
-- ADD CONSTRAINT todos_recurring_template_id_fkey
-- FOREIGN KEY (recurring_template_id) REFERENCES public.todo_recurring_templates(id);
