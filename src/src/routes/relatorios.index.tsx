import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, AlertTriangle, Library, Users, UserSearch } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/relatorios/")({
  component: RelatoriosIndex,
});

const reports = [
  { to: "/relatorios/livros-mais-emprestados", title: "Livros Mais Emprestados", desc: "Ranking de livros por empréstimos no período.", icon: BookOpen, testid: "card-rel-livros" },
  { to: "/relatorios/emprestimos-atrasados", title: "Empréstimos em Atraso", desc: "Empréstimos ativos com data de devolução vencida.", icon: AlertTriangle, testid: "card-rel-atrasos" },
  { to: "/relatorios/disponibilidade-acervo", title: "Disponibilidade do Acervo", desc: "Situação atual de todos os livros cadastrados.", icon: Library, testid: "card-rel-acervo" },
  { to: "/relatorios/usuarios-mais-ativos", title: "Usuários Mais Ativos", desc: "Ranking dos leitores que mais usam a biblioteca.", icon: Users, testid: "card-rel-usuarios" },
  { to: "/relatorios/historico-usuario", title: "Histórico do Usuário", desc: "Empréstimos, reservas e multas por usuário.", icon: UserSearch, testid: "card-rel-historico" },
] as const;

function RelatoriosIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Selecione um relatório para gerar.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link key={r.to} to={r.to} data-testid={r.testid}>
            <Card className="h-full cursor-pointer p-5 transition hover:border-primary hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold">{r.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}