import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Biblioteca" },
      { name: "description", content: "Sistema de Gerenciamento de Biblioteca" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Navigate to="/usuarios" />;
}
