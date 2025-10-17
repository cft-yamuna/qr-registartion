-- Create attendees table for event registration
CREATE TABLE public.attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  qr_code_data text NOT NULL UNIQUE,
  is_scanned boolean DEFAULT false,
  scanned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert (registration)
CREATE POLICY "Allow public registration"
ON public.attendees
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to allow public select for scanning
CREATE POLICY "Allow public read for scanning"
ON public.attendees
FOR SELECT
TO anon
USING (true);

-- Create policy to allow public update for scanning
CREATE POLICY "Allow public update for scanning"
ON public.attendees
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Create index for faster QR code lookups
CREATE INDEX idx_attendees_qr_code ON public.attendees(qr_code_data);

-- Create index for email lookups
CREATE INDEX idx_attendees_email ON public.attendees(email);