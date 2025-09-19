
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slots JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedules"
ON public.schedules
FOR ALL
TO authenticated
USING (
  ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
)
WITH CHECK (
  ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
);

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on schedules table
CREATE TRIGGER trg_schedules_updated_at
BEFORE UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
