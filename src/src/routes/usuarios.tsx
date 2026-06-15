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
  useDB, createUsuario, updateUsuario, deleteUsuario, type Usuario, type Status,
} from "@/lib/store";
import {
  maskCPF, maskPhone, maskDate, isValidCPF, isValidPhone, isValidDate, isValidEmail,
} from "@/lib/masks";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Biblioteca" }] }),
  component: UsuariosPage,
});

type FormState = Omit<Usuario, "id">;
const empty: FormState = {
  nome: "", cpf: "", nascimento: "", endereco: "", email: "", telefone: "", status: "Ativo",
};

function UsuariosPage() {
  const db = useDB();
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchNome, setSearchNome] = useState("");
  const [searchCPF, setSearchCPF] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Ativo" | "Inativo" | "Todos">("Ativo");

  const filtered = useMemo(() => {
    let list = [...db.usuarios];
    if (statusFilter !== "Todos") list = list.filter((u) => u.status === statusFilter);
    if (searchCPF) list = list.filter((u) => u.cpf === searchCPF);
    if (searchNome)
      list = list.filter((u) => u.nome.toLowerCase().includes(searchNome.toLowerCase()));
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [db.usuarios, statusFilter, searchNome, searchCPF]);

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpenForm(true); };
  const openEdit = (u: Usuario) => { setEditing(u); setForm({ ...u }); setErrors({}); setOpenForm(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome obrigatório";
    if (!isValidCPF(form.cpf)) e.cpf = "CPF inválido (XXX.XXX.XXX-XX)";
    if (!isValidDate(form.nascimento)) e.nascimento = "Data inválida (DD/MM/AAAA)";
    if (!form.endereco.trim()) e.endereco = "Endereço obrigatório";
    if (!isValidEmail(form.email)) e.email = "E-mail inválido";
    if (!isValidPhone(form.telefone)) e.telefone = "Telefone inválido ((XX)XXXXX-XXXX)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (editing) {
        const { cpf: _c, ...rest } = form;
        await updateUsuario(editing.id, rest);
        toast.success("Usuário atualizado");
      } else {
        await createUsuario(form);
        toast.success("Usuário cadastrado");
      }
      setOpenForm(false);
    } catch (err: any) {
      toast.error(err.message);
      setErrors((p) => ({ ...p, cpf: err.message }));
    }
  };

  const onConfirmDelete = async () => {
    if (!confirmId) return;
    const res = await deleteUsuario(confirmId);
    setConfirmId(null);
    if (res.soft)
      toast.info("Usuário possui histórico. Status alterado para Inativo.");
    else toast.success("Usuário excluído");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da biblioteca.</p>
        </div>
        <Button onClick={openNew} data-testid="btn-novo-usuario">
          <Plus className="h-4 w-4" /> Novo cadastro
        </Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome" value={searchNome}
              onChange={(e) => setSearchNome(e.target.value)}
              className="pl-8" data-testid="search-nome"
            />
          </div>
          <Input
            placeholder="Buscar por CPF" value={searchCPF}
            onChange={(e) => setSearchCPF(maskCPF(e.target.value))}
            data-testid="search-cpf"
          />
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger data-testid="filter-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
              <SelectItem value="Todos">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table data-testid="tabela-usuarios">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado.
              </TableCell></TableRow>
            )}
            {filtered.map((u) => (
              <TableRow key={u.id} data-testid={`row-usuario-${u.id}`}>
                <TableCell className="font-medium">{u.nome}</TableCell>
                <TableCell>{u.cpf}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.telefone}</TableCell>
                <TableCell>
                  <span className={
                    u.status === "Ativo"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700"
                      : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  }>{u.status}</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)} data-testid={`edit-${u.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirmId(u.id)} data-testid={`delete-${u.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
            <DialogDescription>Preencha os dados do usuário.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nome completo" error={errors.nome}>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} data-testid="input-nome" />
            </Field>
            <Field label="CPF" error={errors.cpf}>
              <Input
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                disabled={!!editing}
                placeholder="000.000.000-00"
                data-testid="input-cpf"
              />
            </Field>
            <Field label="Data de Nascimento" error={errors.nascimento}>
              <Input value={form.nascimento} onChange={(e) => setForm({ ...form, nascimento: maskDate(e.target.value) })} placeholder="DD/MM/AAAA" data-testid="input-nascimento" />
            </Field>
            <Field label="Telefone" error={errors.telefone}>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} placeholder="(00)00000-0000" data-testid="input-telefone" />
            </Field>
            <Field label="E-mail" error={errors.email} className="md:col-span-2">
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
            </Field>
            <Field label="Endereço" error={errors.endereco} className="md:col-span-2">
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} data-testid="input-endereco" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v: Status) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="input-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={submit} data-testid="btn-salvar-usuario">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Se houver histórico, o usuário será marcado como Inativo em vez de excluído.
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

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className ?? ""}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive" data-testid={`error-${label}`}>{error}</p>}
    </div>
  );
}