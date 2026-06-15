import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
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
import { useDB, createAutor, updateAutor, deleteAutor, type Autor } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { maskDate, isValidDate } from "@/lib/masks";

export const Route = createFileRoute("/autores")({
  head: () => ({ meta: [{ title: "Autores — Biblioteca" }] }),
  component: AutoresPage,
});

type FormState = Omit<Autor, "id">;
const empty: FormState = { nome: "", nacionalidade: "", nascimento: "" };

function AutoresPage() {
  const db = useDB();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Autor | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchNome, setSearchNome] = useState("");
  const [filterNac, setFilterNac] = useState<string>("__todas");

  const filtered = useMemo(() => {
    let list = [...db.autores];
    if (searchNome) list = list.filter((a) => a.nome.toLowerCase() === searchNome.toLowerCase());
    if (filterNac !== "__todas") list = list.filter((a) => a.nacionalidade === filterNac);
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [db.autores, searchNome, filterNac]);

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpenForm(true); };
  const openEdit = (a: Autor) => { setEditing(a); setForm({ ...a }); setErrors({}); setOpenForm(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!form.nacionalidade) e.nacionalidade = "Selecione a nacionalidade";
    if (!isValidDate(form.nascimento)) e.nascimento = "Data inválida (DD/MM/AAAA)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (editing) { await updateAutor(editing.id, form); toast.success("Autor atualizado"); }
      else { await createAutor(form); toast.success("Autor cadastrado"); }
      setOpenForm(false);
    } catch (err: any) {
      toast.error(err.message);
      setErrors((p) => ({ ...p, nome: err.message }));
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmId) return;
    try { await deleteAutor(confirmId); toast.success("Autor excluído"); }
    catch (err: any) { toast.error(err.message); }
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Autores</h1>
          <p className="text-sm text-muted-foreground">Gerencie os autores cadastrados.</p>
        </div>
        <Button onClick={openNew} data-testid="btn-novo-autor"><Plus className="h-4 w-4" /> Novo cadastro</Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome (exato)" value={searchNome} onChange={(e) => setSearchNome(e.target.value)} className="pl-8" data-testid="search-nome" />
          </div>
          <Select value={filterNac} onValueChange={setFilterNac}>
            <SelectTrigger data-testid="filter-nacionalidade"><SelectValue placeholder="Filtrar por nacionalidade" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__todas">Todas as nacionalidades</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table data-testid="tabela-autores">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Nacionalidade</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum autor encontrado.</TableCell></TableRow>
            )}
            {filtered.map((a) => (
              <TableRow key={a.id} data-testid={`row-autor-${a.id}`}>
                <TableCell className="font-medium">{a.nome}</TableCell>
                <TableCell>{a.nacionalidade}</TableCell>
                <TableCell>{a.nascimento}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(a)} data-testid={`edit-${a.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmId(a.id)} data-testid={`delete-${a.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar autor" : "Novo autor"}</DialogTitle>
            <DialogDescription>Preencha os dados do autor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-1.5 block">Nome completo</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} data-testid="input-nome" />
              {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Nacionalidade</Label>
              <Select value={form.nacionalidade} onValueChange={(v) => setForm({ ...form, nacionalidade: v })}>
                <SelectTrigger data-testid="input-nacionalidade"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.nacionalidade && <p className="mt-1 text-xs text-destructive">{errors.nacionalidade}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">Data de Nascimento</Label>
              <Input value={form.nascimento} onChange={(e) => setForm({ ...form, nascimento: maskDate(e.target.value) })} placeholder="DD/MM/AAAA" data-testid="input-nascimento" />
              {errors.nascimento && <p className="mt-1 text-xs text-destructive">{errors.nascimento}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={submit} data-testid="btn-salvar-autor">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir autor?</AlertDialogTitle>
            <AlertDialogDescription>Autores com livros vinculados não podem ser excluídos.</AlertDialogDescription>
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