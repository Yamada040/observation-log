import "./styles.css";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/toast-provider";
import { AppHeader } from "@/components/app-header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>
          <AppHeader />
          <div className="app-shell">{children}</div>
          <footer className="global-footer">
            <small>© {new Date().getFullYear()} Observation Log. All rights reserved.</small>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
