import { Link, useRouterState } from "@tanstack/react-router";
import { Users, UserSquare2, Building2, BookOpen, Library, BarChart3 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Usuários", url: "/usuarios", icon: Users, testid: "nav-usuarios" },
  { title: "Autores", url: "/autores", icon: UserSquare2, testid: "nav-autores" },
  { title: "Editoras", url: "/editoras", icon: Building2, testid: "nav-editoras" },
  { title: "Livros", url: "/livros", icon: BookOpen, testid: "nav-livros" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, testid: "nav-relatorios" },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Library className="h-4 w-4" />
          </div>
          <span className="font-semibold">Biblioteca</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={pathname === it.url}>
                    <Link to={it.url} data-testid={it.testid}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}