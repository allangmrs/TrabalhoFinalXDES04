import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDB, type Usuario } from "@/lib/store";
import { downloadCSV, downloadPDF, formatBRDate, formatBRL } from "@/lib/reports";

export const Route = createFileRoute("/relatorios/historico-usuario")({
  component: Page,
});

const MULTA_DIA = 1.0;

function Page() {
  const db = useDB();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);

  const livroPorId = useMemo(() => Object.fromEntries(db.livros.map((l) => [l.id, l])), [db.livros]);

  const candidatos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return db.usuarios
      .filter((u) => u.nome.toLowerCase().includes(q) || u.cpf.includes(q))
      .slice(0, 8);
  }, [busca, db.usuarios]);

  const dados = useMemo(() => {
    if (!selecionado) return null;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const hist = db.historicos.filter((h) => h.usuarioId === selecionado.id);
    const emprestimos = hist.filter((h) => h.tipo === "emprestimo").map((h) => {
      const livro = h.livroId ? livroPorId[h.livroId] : undefined;
      let status = "Ativo";
      let multa = h.valorMulta ?? 0;
      let multaPendente = 0;
      if (h.dataDevolucao) {
        status = "Devolvido";
      } else if (h.dataPrevistaDevolucao) {
        const prev = new Date(h.dataPrevistaDevolucao);
        if (prev < hoje) {
          const dias = Math.floor((hoje.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          multaPendente = dias * MULTA_DIA;
          status = "Em atraso";
        }
      }
      return {
        titulo: livro?.titulo ?? "(livro removido)",
        dataEmp: h.dataEmprestimo ?? null,
        dataPrev: h.dataPrevistaDevolucao ?? null,
        dataDev: h.dataDevolucao ?? null,
        status, multa, multaPendente,
        ts: h.dataEmprestimo ? new Date(h.dataEmprestimo).getTime() : 0,
      };
    }).sort((a, b) => b.ts - a.ts);
    const reservas = hist.filter((h) => h.tipo === "reserva").map((h) => {
      const livro = h.livroId ? livroPorId[h.livroId] : undefined;
      return {
        titulo: livro?.titulo ?? "(livro removido)",
        data: h.dataEmprestimo ?? null,
        status: "Ativa",
        ts: h.dataEmprestimo ? new Date(h.dataEmprestimo).getTime() : 0,
      };
    }).sort((a, b) => b.ts - a.ts);
    const ativos = emprestimos.filter((e) => e.status !== "Devolvido").length;
    const reservasAtivas = reservas.length;
    const totalMultas = emprestimos.reduce((s, e) => s + e.multa, 0);
    const multasPendentes = emprestimos.reduce((s, e) => s + e.multaPendente, 0);
    return { emprestimos, reservas, ativos, reservasAtivas, totalMultas, multasPendentes };
  }, [selecionado, db.historicos, livroPorId]);

  const exportRows = (): (string | number)[][] => {
    if (!selecionado || !dados) return [];
    const head = ["Tipo", "Livro", "Data", "Prev. devolução", "Devolução", "Status", "Multa"];
    const body: (string | number)[][] = [];
    dados.emprestimos.forEach((e) => body.push(["Empréstimo", e.titulo, formatBRDate(e.dataEmp), formatBRDate(e.dataPrev), formatBRDate(e.dataDev), e.status, formatBRL(e.multa)]));
    dados.reservas.forEach((r) => body.push(["Reserva", r.titulo, formatBRDate(r.data), "-", "-", r.status, "-"]));
    return [head, ...body];
  };

  return (
    <ReportShell
      title="Histórico do Usuário"
      description="Consulta completa de empréstimos, reservas e multas."
      filters={
        <div className="w-full space-y-1">
          <Label>Buscar usuário (nome ou CPF)</Label>
          <Input
            data-testid="filtro-busca-usuario"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setSelecionado(null); }}
            placeholder="Digite o nome ou CPF..."
          />
          {busca && !selecionado && (
            <div className="mt-2 max-h-48 overflow-auto rounded-md border bg-card">
              {candidatos.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
              ) : candidatos.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => { setSelecionado(u); setBusca(u.nome); }}
                  data-testid={`opcao-usuario-${u.id}`}
                >
                  <span className="font-medium">{u.nome}</span> — <span className="text-muted-foreground">{u.cpf}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      }
      onExportCSV={dados ? () => downloadCSV(`historico-${selecionado?.cpf}.csv`, exportRows()) : undefined}
      onExportPDF={dados ? () => downloadPDF(`Histórico de ${selecionado?.nome}`, exportRows()[0] as string[], exportRows().slice(1)) : undefined}
    >
      {!selecionado || !dados ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-empty">Selecione um usuário para visualizar o histórico.</p>
      ) : (
        <div className="space-y-6" data-testid="rel-historico">
          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Dados cadastrais</h3>
            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <div><span className="text-muted-foreground">Nome:</span> {selecionado.nome}</div>
              <div><span className="text-muted-foreground">CPF:</span> {selecionado.cpf}</div>
              <div><span className="text-muted-foreground">Telefone:</span> {selecionado.telefone}</div>
              <div><span className="text-muted-foreground">E-mail:</span> {selecionado.email}</div>
              <div className="md:col-span-2"><span className="text-muted-foreground">Endereço:</span> {selecionado.endereco}</div>
            </div>
          </Card>

          <div>
            <h3 className="mb-2 font-semibold">Empréstimos</h3>
            {dados.emprestimos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem empréstimos registrados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livro</TableHead>
                    <TableHead>Empréstimo</TableHead>
                    <TableHead>Prev. devolução</TableHead>
                    <TableHead>Devolução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Multa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.emprestimos.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.titulo}</TableCell>
                      <TableCell>{formatBRDate(e.dataEmp)}</TableCell>
                      <TableCell>{formatBRDate(e.dataPrev)}</TableCell>
                      <TableCell>{formatBRDate(e.dataDev)}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === "Devolvido" ? "default" : e.status === "Em atraso" ? "destructive" : "secondary"}>{e.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatBRL(e.multa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h3 className="mb-2 font-semibold">Reservas</h3>
            {dados.reservas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem reservas registradas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livro</TableHead>
                    <TableHead>Data da reserva</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.reservas.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.titulo}</TableCell>
                      <TableCell>{formatBRDate(r.data)}</TableCell>
                      <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Resumo</h3>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
              <div><div className="text-muted-foreground">Total empréstimos</div><div className="text-lg font-semibold">{dados.emprestimos.length}</div></div>
              <div><div className="text-muted-foreground">Empréstimos ativos</div><div className="text-lg font-semibold">{dados.ativos}</div></div>
              <div><div className="text-muted-foreground">Reservas ativas</div><div className="text-lg font-semibold">{dados.reservasAtivas}</div></div>
              <div><div className="text-muted-foreground">Multas registradas</div><div className="text-lg font-semibold">{formatBRL(dados.totalMultas)}</div></div>
              <div><div className="text-muted-foreground">Multas pendentes</div><div className="text-lg font-semibold text-destructive">{formatBRL(dados.multasPendentes)}</div></div>
            </div>
          </Card>
        </div>
      )}
    </ReportShell>
  );
}