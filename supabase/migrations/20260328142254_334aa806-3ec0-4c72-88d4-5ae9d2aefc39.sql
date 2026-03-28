
-- Create design_uploads table
CREATE TABLE public.design_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  mime_type TEXT,
  category TEXT NOT NULL DEFAULT 'product_design',
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  analysis_result JSONB DEFAULT NULL,
  analysis_status TEXT DEFAULT 'pending',
  extracted_data JSONB DEFAULT NULL,
  scenario_id TEXT DEFAULT NULL,
  team_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_uploads ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (no auth required for this app)
CREATE POLICY "Anyone can read designs" ON public.design_uploads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert designs" ON public.design_uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update designs" ON public.design_uploads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete designs" ON public.design_uploads FOR DELETE USING (true);

-- Create storage bucket for designs
INSERT INTO storage.buckets (id, name, public) VALUES ('designs', 'designs', true);

-- Storage policies
CREATE POLICY "Anyone can upload designs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'designs');
CREATE POLICY "Anyone can read designs" ON storage.objects FOR SELECT USING (bucket_id = 'designs');
CREATE POLICY "Anyone can delete designs" ON storage.objects FOR DELETE USING (bucket_id = 'designs');
