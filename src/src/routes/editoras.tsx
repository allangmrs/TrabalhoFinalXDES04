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
import { useDB, createEditora, updateEditora, deleteEditora, type Editora } from "@/lib/store";
import { COUNTRIES } from "@/lib/countries";
import { maskCNPJ, isValidCNPJ } from "@/lib/masks";

export const Route = createFileRoute("/editoras")({
  head: () => ({ meta: [{ title: "Editoras — Biblioteca" }] }),
  component: EditorasPage,
});

type FormState = Omit<Editora, "id">;
const empty: FormState = { nome: "", cnpj: "", pais: "" };

function EditorasPage() {
  const db = useDB();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Editora | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchNome, setSearchNome] = useState("");
  const [filterPais, setFilterPais] = useState<string>("__todos");

  const filtered = useMemo(() => {
    let list = [...db.editoras];
    if (searchNome) list = list.filter((e) => e.nome.toLowerCase() === searchNome.toLowerCase());
    if (filterPais !== "__todos") list = list.filter((e) => e.pais === filterPais);
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [db.editoras, searchNome, filterPais]);

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpenForm(true); };
  const openEdit = (e: Editora) => { setEditing(e); setForm({ ...e }); setErrors({}); setOpenForm(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!isValidCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido (XX.XXX.XXX/XXXX-XX)";
    if (!form.pais) e.pais = "Selecione o país sede";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (editing) { await updateEditora(editing.id, form); toast.success("Editora atualizada"); }
      else { await createEditora(form); toast.success("Editora cadastrada"); }
      setOpenForm(false);
    } catch (err: any) {
      toast.error(err.message);
      setErrors((p) => ({ ...p, nome: err.message }));
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmId) return;
    try { await deleteEditora(confirmId); toast.success("Editora excluída"); }
    catch (err: any) { toast.error(err.message); }
    setConfirmId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Editoras</h1>
          <p className="text-sm text-muted-foreground">Gerencie as editoras cadastradas.</p>
        </div>
        <Button onClick={openNew} data-testid="btn-nova-editora"><Plus className="h-4 w-4" /> Novo cadastro</Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome (exato)" value={searchNome} onChange={(e) => setSearchNome(e.target.value)} className="pl-8" data-testid="search-nome" />
          </div>
          <Select value={filterPais} onValueChange={setFilterPais}>
            <SelectTrigger data-testid="filter-pais"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__todos">Todos os países</SelectItem>
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table data-testid="tabela-editoras">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>País sede</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma editora encontrada.</TableCell></TableRow>
            )}
            {filtered.map((e) => (
              <TableRow key={e.id} data-testid={`row-editora-${e.id}`}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell>{e.cnpj}</TableCell>
                <TableCell>{e.pais}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(e)} data-testid={`edit-${e.id}`}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmId(e.id)} data-testid={`delete-${e.id}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar editora" : "Nova editora"}</DialogTitle>
            <DialogDescription>Preencha os dados da editora.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label className="mb-1.5 block">Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} data-testid="input-nome" />
              {errors.nome && <p className="mt-1 text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" data-testid="input-cnpj" />
              {errors.cnpj && <p className="mt-1 text-xs text-destructive">{errors.cnpj}</p>}
            </div>
            <div>
              <Label className="mb-1.5 block">País sede</Label>
              <Select value={form.pais} onValueChange={(v) => setForm({ ...form, pais: v })}>
                <SelectTrigger data-testid="input-pais"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.pais && <p className="mt-1 text-xs text-destructive">{errors.pais}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={submit} data-testid="btn-salvar-editora">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir editora?</AlertDialogTitle>
            <AlertDialogDescription>Editoras com livros vinculados não podem ser excluídas.</AlertDialogDescription>
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