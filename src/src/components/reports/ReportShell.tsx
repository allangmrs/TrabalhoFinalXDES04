import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  filters?: ReactNode;
  onGenerate?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  generateLabel?: string;
  generateDisabled?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function ReportShell({
  title, description, filters, onGenerate, onExportCSV, onExportPDF,
  generateLabel = "Gerar Relatório", generateDisabled, loading, children,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/relatorios" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" data-testid="back-relatorios">
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Link>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {filters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            {filters}
            {onGenerate && (
              <Button onClick={onGenerate} disabled={generateDisabled || loading} data-testid="btn-gerar-relatorio">
                {loading ? "Gerando..." : generateLabel}
              </Button>
            )}
          </div>
        </Card>
      )}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-end gap-2">
          {onExportCSV && (
            <Button variant="outline" size="sm" onClick={onExportCSV} data-testid="btn-export-csv">
              <Download className="h-4 w-4" /> CSV
            </Button>
          )}
          {onExportPDF && (
            <Button variant="outline" size="sm" onClick={onExportPDF} data-testid="btn-export-pdf">
              <FileText className="h-4 w-4" /> PDF
            </Button>
          )}
        </div>
        {children}
      </Card>
    </div>
  );
}