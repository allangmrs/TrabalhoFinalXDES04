import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReportShell } from "@/components/reports/ReportShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDB } from "@/lib/store";
import { downloadCSV, downloadPDF, formatBRDate, formatBRL } from "@/lib/reports";

export const Route = createFileRoute("/relatorios/emprestimos-atrasados")({
  component: Page,
});

const MULTA_DIA = 1.0;

interface Row {
  nome: string; cpf: string; titulo: string;
  dataEmp: string; dataPrev: string; dias: number; multa: number;
}

function Page() {
  const db = useDB();
  const [rows, setRows] = useState<Row[] | null>(null);

  const livroPorId = useMemo(() => Object.fromEntries(db.livros.map((l) => [l.id, l])), [db.livros]);
  const userPorId = useMemo(() => Object.fromEntries(db.usuarios.map((u) => [u.id, u])), [db.usuarios]);

  const generate = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const list: Row[] = [];
    db.historicos.forEach((h) => {
      if (h.tipo !== "emprestimo") return;
      if (h.dataDevolucao) return;
      if (!h.dataPrevistaDevolucao) return;
      const prev = new Date(h.dataPrevistaDevolucao);
      if (prev >= hoje) return;
      const dias = Math.floor((hoje.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      const livro = h.livroId ? livroPorId[h.livroId] : undefined;
      const user = h.usuarioId ? userPorId[h.usuarioId] : undefined;
      list.push({
        nome: user?.nome ?? "(usuário removido)",
        cpf: user?.cpf ?? "-",
        titulo: livro?.titulo ?? "(livro removido)",
        dataEmp: h.dataEmprestimo ?? "",
        dataPrev: h.dataPrevistaDevolucao,
        dias,
        multa: dias * MULTA_DIA + (h.valorMulta ?? 0),
      });
    });
    list.sort((a, b) => b.dias - a.dias);
    setRows(list);
  };

  const exportRows = (): (string | number)[][] => {
    const head = ["Usuário", "CPF", "Livro", "Empréstimo", "Prev. devolução", "Dias atraso", "Multa"];
    const body = (rows ?? []).map((r) => [r.nome, r.cpf, r.titulo, formatBRDate(r.dataEmp), formatBRDate(r.dataPrev), r.dias, formatBRL(r.multa)]);
    return [head, ...body];
  };

  return (
    <ReportShell
      title="Empréstimos em Atraso"
      description="Empréstimos ativos com devolução vencida (base: data atual)."
      filters={<div className="text-sm text-muted-foreground">Sem filtros — gerado sob demanda.</div>}
      onGenerate={generate}
      onExportCSV={rows ? () => downloadCSV("emprestimos-atrasados.csv", exportRows()) : undefined}
      onExportPDF={rows ? () => downloadPDF("Empréstimos em Atraso", exportRows()[0] as string[], exportRows().slice(1)) : undefined}
    >
      {!rows ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-empty">Clique em "Gerar Relatório".</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="rel-no-data">Nenhum empréstimo em atraso.</p>
      ) : (
        <Table data-testid="rel-tabela">
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Livro</TableHead>
              <TableHead>Empréstimo</TableHead>
              <TableHead>Prev. devolução</TableHead>
              <TableHead className="text-right">Dias atraso</TableHead>
              <TableHead className="text-right">Multa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} data-testid={`linha-${i}`}>
                <TableCell>{r.nome}</TableCell>
                <TableCell>{r.cpf}</TableCell>
                <TableCell>{r.titulo}</TableCell>
                <TableCell>{formatBRDate(r.dataEmp)}</TableCell>
                <TableCell>{formatBRDate(r.dataPrev)}</TableCell>
                <TableCell className="text-right">{r.dias}</TableCell>
                <TableCell className="text-right">{formatBRL(r.multa)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ReportShell>
  );
}