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

export const Route = createFileRoute("/relatorios/livros-mais-emprestados")({
  component: Page,
});

interface Row { titulo: string; autor: string; qtd: number; pct: number; }

function Page() {
  const db = useDB();
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [qtdLimite, setQtdLimite] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);

  const autorPorId = useMemo(() => Object.fromEntries(db.autores.map((a) => [a.id, a.nome])), [db.autores]);
  const livroPorId = useMemo(() => Object.fromEntries(db.livros.map((l) => [l.id, l])), [db.livros]);

  const generate = () => {
    const ini = parseBRDate(dataInicial);
    const fim = parseBRDate(dataFinal);
    if (!ini || !fim) { toast.error("Informe datas válidas (DD/MM/AAAA)."); return; }
    if (ini > fim) { toast.error("Data inicial não pode ser maior que a final."); return; }
    const fimDia = new Date(fim); fimDia.setHours(23, 59, 59, 999);
    const emp = db.historicos.filter((h) => {
      if (h.tipo !== "emprestimo") return false;
      if (!h.dataEmprestimo) return false;
      const d = new Date(h.dataEmprestimo);
      return d >= ini && d <= fimDia;
    });
    const total = emp.length;
    const map = new Map<string, number>();
    emp.forEach((h) => h.livroId && map.set(h.livroId, (map.get(h.livroId) ?? 0) + 1));
    let result: Row[] = [...map.entries()].map(([id, qtd]) => {
      const livro = livroPorId[id];
      return {
        titulo: livro?.titulo ?? "(livro removido)",
        autor: livro ? (autorPorId[livro.autorId] ?? "-") : "-",
        qtd,
        pct: total ? (qtd * 100) / total : 0,
      };
    }).sort((a, b) => b.qtd - a.qtd || a.titulo.localeCompare(b.titulo));
    const limite = Number(qtdLimite);
    if (qtdLimite && Number.isFinite(limite) && limite > 0) result = result.slice(0, limite);
    setRows(result);
  };

  const exportRows = (): (string | number)[][] => {
    const head = ["Título", "Autor", "Qtd. empréstimos", "% participação"];
    const body = (rows ?? []).map((r) => [r.titulo, r.autor, r.qtd, `${r.pct.toFixed(2)}%`]);
    return [head, ...body];
  };

  return (
    <ReportShell
      title="Livros Mais Emprestados"
      description="Ranking de livros por número de empréstimos no período."
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
            <Label>Qtd. resultados (opcional)</Label>
            <Input data-testid="filtro-qtd" value={qtdLimite} onChange={(e) => setQtdLimite(e.target.value.replace(/\D/g, ""))} placeholder="Todos" />
          </div>
        </>
      }
      onGenerate={generate}
      onExportCSV={rows ? () => downloadCSV("livros-mais-emprestados.csv", exportRows()) : undefined}
      onExportPDF={rows ? () => downloadPDF("Livros Mais Emprestados", exportRows()[0] as string[], exportRows().slice(1)) : undefined}
    >
      {!rows ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-empty">Preencha os filtros e clique em "Gerar Relatório".</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-no-data">Nenhum empréstimo encontrado para o período selecionado.</p>
      ) : (
        <Table data-testid="rel-tabela">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead className="text-right">Qtd. empréstimos</TableHead>
              <TableHead className="text-right">% participação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} data-testid={`linha-${i}`}>
                <TableCell>{r.titulo}</TableCell>
                <TableCell>{r.autor}</TableCell>
                <TableCell className="text-right">{r.qtd}</TableCell>
                <TableCell className="text-right">{r.pct.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportShell>
  );
}