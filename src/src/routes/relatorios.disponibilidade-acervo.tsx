import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDB } from "@/lib/store";
import { downloadCSV, downloadPDF } from "@/lib/reports";

export const Route = createFileRoute("/relatorios/disponibilidade-acervo")({
  component: Page,
});

interface Row {
  titulo: string; autor: string; categoria: string;
  total: number; disponiveis: number; emprestados: number; status: string;
}

function Page() {
  const db = useDB();
  const [rows, setRows] = useState<Row[] | null>(null);

  const autorPorId = useMemo(() => Object.fromEntries(db.autores.map((a) => [a.id, a.nome])), [db.autores]);

  const generate = () => {
    // count active loans (without devolucao) per livro
    const emprestados = new Map<string, number>();
    db.historicos.forEach((h) => {
      if (h.tipo === "emprestimo" && !h.dataDevolucao && h.livroId) {
        emprestados.set(h.livroId, (emprestados.get(h.livroId) ?? 0) + 1);
      }
    });
    const list: Row[] = db.livros.map((l) => {
      const emp = Math.min(emprestados.get(l.id) ?? 0, l.exemplares);
      const disp = l.exemplares - emp;
      let status = "Disponível";
      if (disp <= 0) status = "Indisponível";
      else if (emp > 0) status = "Parcialmente Disponível";
      return {
        titulo: l.titulo,
        autor: autorPorId[l.autorId] ?? "-",
        categoria: l.categoria,
        total: l.exemplares,
        disponiveis: disp,
        emprestados: emp,
        status,
      };
    }).sort((a, b) => a.titulo.localeCompare(b.titulo));
    setRows(list);
  };

  const exportRows = (): (string | number)[][] => {
    const head = ["Título", "Autor", "Categoria", "Total", "Disponíveis", "Emprestados", "Status"];
    const body = (rows ?? []).map((r) => [r.titulo, r.autor, r.categoria, r.total, r.disponiveis, r.emprestados, r.status]);
    return [head, ...body];
  };

  const statusVariant = (s: string): "default" | "secondary" | "destructive" =>
    s === "Disponível" ? "default" : s === "Indisponível" ? "destructive" : "secondary";

  return (
    <ReportShell
      title="Disponibilidade do Acervo"
      description="Situação atual de todos os livros cadastrados."
      filters={<div className="text-sm text-muted-foreground">Sem filtros — relatório completo do acervo.</div>}
      onGenerate={generate}
      onExportCSV={rows ? () => downloadCSV("disponibilidade-acervo.csv", exportRows()) : undefined}
      onExportPDF={rows ? () => downloadPDF("Disponibilidade do Acervo", exportRows()[0] as string[], exportRows().slice(1)) : undefined}
    >
      {!rows ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-empty">Clique em "Gerar Relatório".</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-no-data">Nenhum livro cadastrado.</p>
      ) : (
        <Table data-testid="rel-tabela">
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Disponíveis</TableHead>
              <TableHead className="text-right">Emprestados</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} data-testid={`linha-${i}`}>
                <TableCell>{r.titulo}</TableCell>
                <TableCell>{r.autor}</TableCell>
                <TableCell>{r.categoria}</TableCell>
                <TableCell className="text-right">{r.total}</TableCell>
                <TableCell className="text-right">{r.disponiveis}</TableCell>
                <TableCell className="text-right">{r.emprestados}</TableCell>
                <TableCell><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportShell>
  );
}