import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Status = "Ativo" | "Inativo";

const statusSchema = z.enum(["Ativo", "Inativo"]);
const usuarioSchema = z.object({
  nome: z.string().min(1),
  cpf: z.string().min(1),
  nascimento: z.string().min(1),
  endereco: z.string().min(1),
  email: z.string().min(1),
  telefone: z.string().min(1),
  status: statusSchema,
});
const usuarioUpdateSchema = usuarioSchema.omit({ cpf: true });
const autorSchema = z.object({ nome: z.string().min(1), nacionalidade: z.string().min(1), nascimento: z.string().min(1) });
const editoraSchema = z.object({ nome: z.string().min(1), cnpj: z.string().min(1), pais: z.string().min(1) });
const livroSchema = z.object({
  titulo: z.string().min(1),
  autorId: z.string().uuid(),
  editoraId: z.string().uuid(),
  isbn: z.string().min(1),
  categoria: z.string().min(1),
  ano: z.number(),
  exemplares: z.number(),
  status: statusSchema,
});

function formatDbError(error: { code?: string; message?: string; details?: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "23505") {
    const message = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
    if (message.includes("usuarios") || message.includes("cpf")) return "CPF já cadastrado no sistema.";
    if (message.includes("autores") || message.includes("nome")) return "Já existe um autor com esse nome.";
    if (message.includes("editoras") || message.includes("cnpj")) return "Já existe editora com mesmo nome e CNPJ.";
    if (message.includes("livros") || message.includes("isbn")) return "ISBN já cadastrado no sistema.";
  }
  return error.message ?? fallback;
}

export const getLibraryData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [usuarios, autores, editoras, livros, historicos] = await Promise.all([
    supabaseAdmin.from("usuarios").select("id,nome,cpf,nascimento,endereco,email,telefone,status"),
    supabaseAdmin.from("autores").select("id,nome,nacionalidade,nascimento"),
    supabaseAdmin.from("editoras").select("id,nome,cnpj,pais"),
    supabaseAdmin.from("livros").select("id,titulo,autor_id,editora_id,isbn,categoria,ano,exemplares,status"),
    supabaseAdmin
      .from("historicos")
      .select("usuario_id,livro_id,tipo,data_emprestimo,data_prevista_devolucao,data_devolucao,valor_multa,created_at"),
  ]);

  for (const result of [usuarios, autores, editoras, livros, historicos]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    usuarios: (usuarios.data ?? []).map((u) => ({ ...u, status: u.status as Status })),
    autores: autores.data ?? [],
    editoras: editoras.data ?? [],
    livros: (livros.data ?? []).map((l) => ({
      id: l.id,
      titulo: l.titulo,
      autorId: l.autor_id,
      editoraId: l.editora_id,
      isbn: l.isbn,
      categoria: l.categoria,
      ano: l.ano,
      exemplares: l.exemplares,
      status: l.status as Status,
    })),
    historicos: (historicos.data ?? []).map((h: any) => ({
      usuarioId: h.usuario_id ?? undefined,
      livroId: h.livro_id ?? undefined,
      tipo: h.tipo as "emprestimo" | "devolucao" | "reserva",
      dataEmprestimo: h.data_emprestimo ?? h.created_at ?? null,
      dataPrevistaDevolucao: h.data_prevista_devolucao ?? null,
      dataDevolucao: h.data_devolucao ?? null,
      valorMulta: Number(h.valor_multa ?? 0),
    })),
  };
});

export const saveUsuario = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid().optional(), values: usuarioSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = data.id
      ? await supabaseAdmin.from("usuarios").update(data.values).eq("id", data.id)
      : await supabaseAdmin.from("usuarios").insert(data.values);
    if (error) throw new Error(formatDbError(error, "Não foi possível salvar o usuário."));
    return { ok: true };
  });

export const updateUsuarioData = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid(), values: usuarioUpdateSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("usuarios").update(data.values).eq("id", data.id);
    if (error) throw new Error(formatDbError(error, "Não foi possível atualizar o usuário."));
    return { ok: true };
  });

export const removeUsuario = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("historicos")
      .select("id", { count: "exact", head: true })
      .eq("usuario_id", data.id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      const { error } = await supabaseAdmin.from("usuarios").update({ status: "Inativo" }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { soft: true };
    }
    const { error } = await supabaseAdmin.from("usuarios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { soft: false };
  });

export const saveAutor = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid().optional(), values: autorSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = data.id
      ? await supabaseAdmin.from("autores").update(data.values).eq("id", data.id)
      : await supabaseAdmin.from("autores").insert(data.values);
    if (error) throw new Error(formatDbError(error, "Não foi possível salvar o autor."));
    return { ok: true };
  });

export const removeAutor = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin.from("livros").select("id", { count: "exact", head: true }).eq("autor_id", data.id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) throw new Error("Autor possui livros vinculados. Exclusão bloqueada.");
    const { error } = await supabaseAdmin.from("autores").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveEditora = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid().optional(), values: editoraSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = data.id
      ? await supabaseAdmin.from("editoras").update(data.values).eq("id", data.id)
      : await supabaseAdmin.from("editoras").insert(data.values);
    if (error) throw new Error(formatDbError(error, "Não foi possível salvar a editora."));
    return { ok: true };
  });

export const removeEditora = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin.from("livros").select("id", { count: "exact", head: true }).eq("editora_id", data.id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) throw new Error("Editora possui livros vinculados. Exclusão bloqueada.");
    const { error } = await supabaseAdmin.from("editoras").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveLivro = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid().optional(), values: livroSchema }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      titulo: data.values.titulo,
      autor_id: data.values.autorId,
      editora_id: data.values.editoraId,
      isbn: data.values.isbn,
      categoria: data.values.categoria,
      ano: data.values.ano,
      exemplares: data.values.exemplares,
      status: data.values.status,
    };
    const { error } = data.id
      ? await supabaseAdmin.from("livros").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("livros").insert(payload);
    if (error) throw new Error(formatDbError(error, "Não foi possível salvar o livro."));
    return { ok: true };
  });

export const removeLivro = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin.from("historicos").select("id", { count: "exact", head: true }).eq("livro_id", data.id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      const { error } = await supabaseAdmin.from("livros").update({ status: "Inativo" }).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { soft: true };
    }
    const { error } = await supabaseAdmin.from("livros").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { soft: false };
  });