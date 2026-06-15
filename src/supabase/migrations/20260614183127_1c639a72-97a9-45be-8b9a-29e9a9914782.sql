CREATE POLICY "Direct access denied for usuarios"
ON public.usuarios
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Direct access denied for autores"
ON public.autores
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Direct access denied for editoras"
ON public.editoras
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Direct access denied for livros"
ON public.livros
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Direct access denied for historicos"
ON public.historicos
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);