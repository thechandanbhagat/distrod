// @group Configuration : Root app shell — titlebar + sidebar + main content area
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";

interface AppShellProps {
  children: React.ReactNode;
}

// @group BusinessLogic : AppShell layout wrapper
export function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg-app)", color: "var(--text-1)" }}
    >
      <TitleBar />
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 50% at 60% -10%, var(--accent-glow) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
