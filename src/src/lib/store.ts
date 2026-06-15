import { useEffect, useSyncExternalStore } from "react";

import {
  getLibraryData,
  removeAutor,
  removeEditora,
  removeLivro,
  removeUsuario,
  saveAutor,
  saveEditora,
  saveLivro,
  saveUsuario,
  updateUsuarioData,
} from "./library.functions";

export type Status = "Ativo" | "Inativo";

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  nascimento: string;
  endereco: string;
  email: string;
  telefone: string;
  status: Status;
}

export interface Autor {
  id: string;
  nome: string;
  nacionalidade: string;
  nascimento: string;
}

export interface Editora {
  id: string;
  nome: string;
  cnpj: string;
  pais: string;
}

export interface Livro {
  id: string;
  titulo: string;
  autorId: string;
  editoraId: string;
  isbn: string;
  categoria: string;
  ano: number;
  exemplares: number;
  status: Status;
}

export interface Historico {
  usuarioId?: string;
  livroId?: string;
  tipo: "emprestimo" | "devolucao" | "reserva";
}

interface DB {
  usuarios: Usuario[];
  autores: Autor[];
  editoras: Editora[];
  livros: Livro[];
  historicos: Historico[];
}

const emptyDB: DB = { usuarios: [], autores: [], editoras: [], livros: [], historicos: [] };

let db: DB = emptyDB;
let loaded = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => db;
const getServerSnapshot = () => emptyDB;

async function refreshDB() {
  db = (await getLibraryData()) as DB;
  loaded = true;
  emit();
}

function ensureLoaded() {
  if (!loadPromise) {
    loadPromise = refreshDB().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export const useDB = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    if (!loaded) void ensureLoaded();
  }, []);
  return snapshot;
};

export const usuariosHasHistory = (id: string) => db.historicos.some((h) => h.usuarioId === id);

export const createUsuario = async (u: Omit<Usuario, "id">) => {
  await saveUsuario({ data: { values: u } });
  await refreshDB();
};

export const updateUsuario = async (id: string, u: Omit<Usuario, "id" | "cpf">) => {
  await updateUsuarioData({ data: { id, values: u } });
  await refreshDB();
};

export const deleteUsuario = async (id: string): Promise<{ soft: boolean }> => {
  const result = await removeUsuario({ data: { id } });
  await refreshDB();
  return result;
};

export const autorHasLivros = (id: string) => db.livros.some((l) => l.autorId === id);

export const createAutor = async (a: Omit<Autor, "id">) => {
  await saveAutor({ data: { values: a } });
  await refreshDB();
};

export const updateAutor = async (id: string, a: Omit<Autor, "id">) => {
  await saveAutor({ data: { id, values: a } });
  await refreshDB();
};

export const deleteAutor = async (id: string) => {
  await removeAutor({ data: { id } });
  await refreshDB();
};

export const editoraHasLivros = (id: string) => db.livros.some((l) => l.editoraId === id);

export const createEditora = async (e: Omit<Editora, "id">) => {
  await saveEditora({ data: { values: e } });
  await refreshDB();
};

export const updateEditora = async (id: string, e: Omit<Editora, "id">) => {
  await saveEditora({ data: { id, values: e } });
  await refreshDB();
};

export const deleteEditora = async (id: string) => {
  await removeEditora({ data: { id } });
  await refreshDB();
};

export const livroHasHistory = (id: string) => db.historicos.some((h) => h.livroId === id);

export const createLivro = async (l: Omit<Livro, "id">) => {
  await saveLivro({ data: { values: l } });
  await refreshDB();
};

export const updateLivro = async (id: string, l: Omit<Livro, "id">) => {
  await saveLivro({ data: { id, values: l } });
  await refreshDB();
};

export const deleteLivro = async (id: string): Promise<{ soft: boolean }> => {
  const result = await removeLivro({ data: { id } });
  await refreshDB();
  return result;
};