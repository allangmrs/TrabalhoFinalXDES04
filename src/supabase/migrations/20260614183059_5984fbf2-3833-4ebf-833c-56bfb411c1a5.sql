CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text NOT NULL UNIQUE,
  nascimento text NOT NULL,
  endereco text NOT NULL,
  email text NOT NULL,
  telefone text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.autores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  nacionalidade text NOT NULL,
  nascimento text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.autores TO service_role;
ALTER TABLE public.autores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.editoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text NOT NULL,
  pais text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT editoras_nome_cnpj_unique UNIQUE (nome, cnpj)
);
GRANT ALL ON public.editoras TO service_role;
ALTER TABLE public.editoras ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.livros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  autor_id uuid NOT NULL REFERENCES public.autores(id) ON DELETE RESTRICT,
  editora_id uuid NOT NULL REFERENCES public.editoras(id) ON DELETE RESTRICT,
  isbn text NOT NULL UNIQUE,
  categoria text NOT NULL,
  ano integer NOT NULL,
  exemplares integer NOT NULL DEFAULT 1 CHECK (exemplares >= 0),
  status text NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.livros TO service_role;
ALTER TABLE public.livros ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.historicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  livro_id uuid REFERENCES public.livros(id) ON DELETE SET NULL,
  tipo text NOT NULL CHECK (tipo IN ('emprestimo', 'devolucao', 'reserva')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.historicos TO service_role;
ALTER TABLE public.historicos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_autores_updated_at
BEFORE UPDATE ON public.autores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_editoras_updated_at
BEFORE UPDATE ON public.editoras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_livros_updated_at
BEFORE UPDATE ON public.livros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.autores (id, nome, nacionalidade, nascimento) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Machado de Assis', 'Brasil', '21/06/1839'),
  ('00000000-0000-0000-0000-0000000000a2', 'J.K. Rowling', 'Reino Unido', '31/07/1965'),
  ('00000000-0000-0000-0000-0000000000a3', 'George Orwell', 'Reino Unido', '25/06/1903')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.editoras (id, nome, cnpj, pais) VALUES
  ('00000000-0000-0000-0000-0000000000e1', 'Companhia das Letras', '12.345.678/0001-90', 'Brasil'),
  ('00000000-0000-0000-0000-0000000000e2', 'Rocco', '98.765.432/0001-10', 'Brasil')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.usuarios (id, nome, cpf, nascimento, endereco, email, telefone, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ana Silva', '123.456.789-09', '10/05/1990', 'Rua A, 100', 'ana@example.com', '(11)98888-7777', 'Ativo'),
  ('00000000-0000-0000-0000-000000000002', 'Bruno Costa', '987.654.321-00', '22/11/1985', 'Av. B, 200', 'bruno@example.com', '(21)97777-6666', 'Ativo'),
  ('00000000-0000-0000-0000-000000000003', 'Carla Dias', '111.222.333-44', '01/01/1995', 'Rua C, 300', 'carla@example.com', '(31)96666-5555', 'Inativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.livros (id, titulo, autor_id, editora_id, isbn, categoria, ano, exemplares, status) VALUES
  ('00000000-0000-0000-0000-000000000011', 'Dom Casmurro', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000e1', '978-85-359-0277-5', 'Literatura Brasileira', 1899, 5, 'Ativo'),
  ('00000000-0000-0000-0000-000000000012', '1984', '00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-0000000000e2', '978-0-452-28423-4', 'Ficção Científica', 1949, 3, 'Ativo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.historicos (livro_id, tipo) VALUES
  ('00000000-0000-0000-0000-000000000011', 'emprestimo');