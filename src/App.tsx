// @group Configuration : Root App component — page router + layout shell
import "./index.css";
import { AppShell } from "./components/layout/AppShell";
import { ThemeProvider } from "./components/ThemeProvider";
import { useUiStore } from "./store/uiStore";
import { useDistroSync } from "./hooks/useDistroSync";
import type { Page } from "./types";
import { DistrosPage } from "./pages/DistrosPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { ProcessesPage } from "./pages/ProcessesPage";
import { FilesPage } from "./pages/FilesPage";
import { TerminalPage } from "./pages/TerminalPage";
import { NetworkPage } from "./pages/NetworkPage";
import { SnapshotsPage } from "./pages/SnapshotsPage";
import { ServicesPage } from "./pages/ServicesPage";
import { NginxPage } from "./pages/NginxPage";
import { SettingsPage } from "./pages/SettingsPage";

// @group BusinessLogic : Standard pages — mounted on demand; they re-fetch on each visit
function StandardPage({ page }: { page: Page }) {
  switch (page) {
    case "distros":   return <DistrosPage />;
    case "resources": return <ResourcesPage />;
    case "processes": return <ProcessesPage />;
    case "files":     return <FilesPage />;
    case "network":   return <NetworkPage />;
    case "snapshots": return <SnapshotsPage />;
    case "services":  return <ServicesPage />;
    case "nginx":     return <NginxPage />;
    case "settings":  return <SettingsPage />;
    default:          return <DistrosPage />;
  }
}

// @group BusinessLogic : Page router. TerminalPage stays mounted (just hidden) so live PTY
// sessions and scrollback survive navigating to another page and back; the rest mount on demand.
function PageRouter() {
  const { currentPage } = useUiStore();
  const isTerminal = currentPage === "terminal";

  return (
    <>
      <div style={{ height: "100%", display: isTerminal ? "block" : "none" }}>
        <TerminalPage />
      </div>
      {!isTerminal && <StandardPage page={currentPage} />}
    </>
  );
}

// @group Exports : App root
export default function App() {
  // Keep the distro list synced app-wide so every page has it, not just DistrosPage.
  useDistroSync();

  return (
    <ThemeProvider>
      <AppShell>
        <PageRouter />
      </AppShell>
    </ThemeProvider>
  );
}
