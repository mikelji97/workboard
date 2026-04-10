-- ══════════════════════════════════════════
--  ACTUALIZACIÓN V2 — Ejecutar en SQL Editor
-- ══════════════════════════════════════════

-- Nuevas columnas en projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS folders jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS doc_content text DEFAULT '';

-- Nuevas columnas en notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Tabla de ARCHIVOS COMPARTIDOS
CREATE TABLE IF NOT EXISTS public.shared_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_name text DEFAULT '',
  file_name text NOT NULL,
  file_url text NOT NULL,
  is_public boolean DEFAULT false,
  shared_with uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Políticas: ver archivos propios, compartidos conmigo, o públicos
CREATE POLICY "Users read own shared files" ON public.shared_files
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users read files shared with them" ON public.shared_files
  FOR SELECT USING (auth.uid() = ANY(shared_with));

CREATE POLICY "Anyone reads public files" ON public.shared_files
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users insert own shared files" ON public.shared_files
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users delete own shared files" ON public.shared_files
  FOR DELETE USING (auth.uid() = owner_id);

-- ══════════════════════════════════════════
--  STORAGE BUCKET para archivos de proyectos
-- ══════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Users upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to shared files
CREATE POLICY "Public read shared files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[2] = 'shared'
  );
