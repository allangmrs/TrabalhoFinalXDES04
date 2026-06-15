import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  useDB, createLivro, updateLivro, deleteLivro, type Livro, type Status,
} from "@/lib/store";
import { BOOK_CATEGORIES } from "@/lib/countries";

export const Route = createFileRoute("/livros")({
  head: () => ({ meta: [{ title: "Livros — Biblioteca" }] }),
  component: LivrosPage,
});

type FormState = Omit<Livro, "id">;
const empty: FormState = {
  titulo: "", autorId: "", editoraId: "", isbn: "", categoria: "",
  ano: new Date().getFullYear(), exemplares: 1, status: "Ativo",
};

function LivrosPage() {
  const db = useDB();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Livro | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchTitulo, setSearchTitulo] = useState("");
  const [searchISBN, setSearchISBN] = useState("");
  const [filterAutor, setFilterAutor] = useState<string>("__todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("__todas");

  const autorNome = (id: string) => db.autores.find((a) => a.id === id)?.nome ?? "—";
  const editoraNome = (id: string) => db.editoras.find((e) => e.id === id)?.nome ?? "—";

  const filtered = useMemo(() => {
    let list = [...db.livros];
    if (searchISBN) list = list.filter((l) => l.isbn === searchISBN);
    if (searchTitulo) list = list.filter((l) => l.titulo.toLowerCase().includes(searchTitulo.toLowerCase()));
    if (filterAutor !== "__todos") list = list.filter((l) => l.autorId === filterAutor);
    if (filterCategoria !== "__todas") list = list.filter((l) => l.categoria === filterCategoria);
    return list.sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [db.livros, searchTitulo, searchISBN, filterAutor, filterCategoria]);

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpenForm(true); };
  const openEdit = (l: Livro) => { setEditing(l); setForm({ ...l }); setErrors({}); setOpenForm(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "Título obrigatório";
    if (!form.autorId) e.autorId = "Selecione o autor";
    if (!form.editoraId) e.editoraId = "Selecione a editora";
    if (!form.isbn.trim()) e.isbn = "ISBN obrigatório";
    if (!form.categoria) e.categoria = "Selecione a categoria";
    if (!form.ano || form.ano < 0) e.ano = "Ano inválido";
    if (!form.exemplares || form.exemplares < 0) e.exemplares = "Quantidade inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (editing) { await updateLivro(editing.id, form); toast.success("Livro atualizado"); }
      else { await createLivro(form); toast.success("Livro cadastrado"); }
      setOpenForm(false);
    } catch (err: any) {
      toast.error(err.message);
      setErrors((p) => ({ ...p, isbn: err.message }));
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmId) return;
    const res = await deleteLivro(confirmId);
    setConfirmId(null);
    if (res.soft) toast.info("Livro possui histórico. Status alterado para Inativo.");
    else toast.success("Livro excluído");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Livros</h1>
          <p className="text-sm text-muted-foreground">Gerencie o acervo da biblioteca.</p>
        </div>
        <Button onClick={openNew} data-testid="btn-novo-livro"><Plus className="h-4 w-4" /> Novo cadastro</Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título" value={searchTitulo} onChange={(e) => setSearchTitulo(e.target.value)} className="pl-8" data-testid="search-titulo" />
          </div>
          <Input placeholder="Buscar por ISBN" value={searchISBN} onChange={(e) => setSearchISBN(e.target.value)} data-testid="search-isbn" />
          <Select value={filterAutor} onValueChange={setFilterAutor}>
            <SelectTrigger data-testid="filter-autor"><SelectValue placeholder="Autor" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__todos">Todos os autores</SelectItem>
              {[...db.autores].sort((a, b) => a.nome.localeCompare(b.nome)).map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger data-testid="filter-categoria"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__todas">Todas as categorias</SelectItem>
              {BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table data-testid="tabela-livros">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Editora</TableHead>
              <TableHead>ISBN</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Ano</TableHead>
              <TableHead>Exemplares</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum livro encontrado.</TableCell></TableRow>
            )}
            {filtered.map((l) => (
              <TableRow key={l.id} data-testid={`row-livro-${l.id}`}>
                <TableCell className="font-medium">{l.titulo}</TableCell>
                <TableCell>{autorNome(l.autorId)}</TableCell>
                <TableCell>{editoraNome(l.editoraId)}</TableCell>
                <TableCell className="font-mono text-xs">{l.isbn}</TableCell>
                <TableCell>{l.categoria}</TableCell>
                <TableCell>{l.ano}</TableCell>
                <TableCell>{l.exemplares}</TableCell>
                <TableCell>
                  <span className={l.status === "Ativo" ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700" : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"}>
                    {l.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(l)} data-testid={`edit-${l.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmId(l.id)} data-testid={`delete-${l.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar livro" : "Novo livro"}</DialogTitle>
            <DialogDescription>Preencha os dados do livro.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label className="mb-1.5 block">Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} data-testid="input-titulo" />
              {errors.titulo && <p className="mt-1 text-xs text-destructive">{errors.titulo}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Autor</Label>
              <Select value={form.autorId} onValueChange={(v) => setForm({ ...form, autorId: v })}>
                <SelectTrigger data-testid="input-autor"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {db.autores.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.autorId && <p className="mt-1 text-xs text-destructive">{errors.autorId}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Editora</Label>
              <Select value={form.editoraId} onValueChange={(v) => setForm({ ...form, editoraId: v })}>
                <SelectTrigger data-testid="input-editora"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {db.editoras.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.editoraId && <p className="mt-1 text-xs text-destructive">{errors.editoraId}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">ISBN</Label>
              <Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} data-testid="input-isbn" />
              {errors.isbn && <p className="mt-1 text-xs text-destructive">{errors.isbn}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger data-testid="input-categoria"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="mt-1 text-xs text-destructive">{errors.categoria}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Ano de Publicação</Label>
              <Input type="number" value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} data-testid="input-ano" />
              {errors.ano && <p className="mt-1 text-xs text-destructive">{errors.ano}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Quantidade de Exemplares</Label>
              <Input type="number" value={form.exemplares} onChange={(e) => setForm({ ...form, exemplares: Number(e.target.value) })} data-testid="input-exemplares" />
              {errors.exemplares && <p className="mt-1 text-xs text-destructive">{errors.exemplares}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Status</Label>
              <Select value={form.status} onValueChange={(v: Status) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="input-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={submit} data-testid="btn-salvar-livro">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir livro?</AlertDialogTitle>
            <AlertDialogDescription>
              Livros com histórico (empréstimos/devoluções/reservas) serão marcados como Inativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} data-testid="confirm-delete">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}