import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDB } from "@/lib/store";
import { maskDate } from "@/lib/masks";
import { downloadCSV, downloadPDF, parseBRDate } from "@/lib/reports";
import { toast } from "sonner";

export const Route = createFileRoute("/relatorios/usuarios-mais-ativos")({
  component: Page,
});

interface Row { nome: string; cpf: string; emp: number; dev: number; pct: number; }

function Page() {
  const db = useDB();
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [qtd, setQtd] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);

  const userPorId = useMemo(() => Object.fromEntries(db.usuarios.map((u) => [u.id, u])), [db.usuarios]);

  const generate = () => {
    const ini = parseBRDate(dataInicial);
    const fim = parseBRDate(dataFinal);
    const limite = Number(qtd);
    if (!ini || !fim) { toast.error("Informe datas válidas."); return; }
    if (ini > fim) { toast.error("Data inicial maior que a final."); return; }
    if (!Number.isFinite(limite) || limite <= 0) { toast.error("Informe a quantidade de usuários."); return; }
    const fimDia = new Date(fim); fimDia.setHours(23, 59, 59, 999);
    const inPeriodo = (iso?: string | null) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= ini && d <= fimDia;
    };
    const acc = new Map<string, { emp: number; dev: number }>();
    db.historicos.forEach((h) => {
      if (!h.usuarioId) return;
      if (h.tipo === "emprestimo" && inPeriodo(h.dataEmprestimo)) {
        const cur = acc.get(h.usuarioId) ?? { emp: 0, dev: 0 };
        cur.emp++; acc.set(h.usuarioId, cur);
      }
      if (h.dataDevolucao && inPeriodo(h.dataDevolucao)) {
        const cur = acc.get(h.usuarioId) ?? { emp: 0, dev: 0 };
        cur.dev++; acc.set(h.usuarioId, cur);
      }
    });
    const total = [...acc.values()].reduce((s, v) => s + v.emp, 0);
    let result: Row[] = [...acc.entries()].map(([id, v]) => {
      const u = userPorId[id];
      return {
        nome: u?.nome ?? "(removido)",
        cpf: u?.cpf ?? "-",
        emp: v.emp, dev: v.dev,
        pct: total ? (v.emp * 100) / total : 0,
      };
    }).sort((a, b) => b.emp - a.emp || a.nome.localeCompare(b.nome));
    result = result.slice(0, limite);
    setRows(result);
  };

  const exportRows = (): (string | number)[][] => {
    const head = ["Usuário", "CPF", "Empréstimos", "Devoluções", "% participação"];
    const body = (rows ?? []).map((r) => [r.nome, r.cpf, r.emp, r.dev, `${r.pct.toFixed(2)}%`]);
    return [head, ...body];
  };

  return (
    <ReportShell
      title="Usuários Mais Ativos"
      description="Ranking de usuários por movimentações no período."
      filters={
        <>
          <div className="space-y-1">
            <Label>Data inicial *</Label>
            <Input data-testid="filtro-data-inicial" value={dataInicial} onChange={(e) => setDataInicial(maskDate(e.target.value))} placeholder="DD/MM/AAAA" />
          </div>
          <div className="space-y-1">
            <Label>Data final *</Label>
            <Input data-testid="filtro-data-final" value={dataFinal} onChange={(e) => setDataFinal(maskDate(e.target.value))} placeholder="DD/MM/AAAA" />
          </div>
          <div className="space-y-1">
            <Label>Qtd. usuários *</Label>
            <Input data-testid="filtro-qtd" value={qtd} onChange={(e) => setQtd(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 10" />
          </div>
        </>
      }
      onGenerate={generate}
      onExportCSV={rows ? () => downloadCSV("usuarios-mais-ativos.csv", exportRows()) : undefined}
      onExportPDF={rows ? () => downloadPDF("Usuários Mais Ativos", exportRows()[0] as string[], exportRows().slice(1)) : undefined}
    >
      {!rows ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-empty">Preencha os filtros e clique em "Gerar Relatório".</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-no-data">Nenhuma movimentação encontrada no período.</p>
      ) : (
        <Table data-testid="rel-tabela">
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead className="text-right">Empréstimos</TableHead>
              <TableHead className="text-right">Devoluções</TableHead>
              <TableHead className="text-right">% participação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} data-testid={`linha-${i}`}>
                <TableCell>{r.nome}</TableCell>
                <TableCell>{r.cpf}</TableCell>
                <TableCell className="text-right">{r.emp}</TableCell>
                <TableCell className="text-right">{r.dev}</TableCell>
                <TableCell className="text-right">{r.pct.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportShell>
  );
}