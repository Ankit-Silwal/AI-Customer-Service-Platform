import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider, ToastHost, WorkspaceProvider } from "../lib/app-state";
import Nav from "./nav";

export const metadata: Metadata = { title: "Warmdesk — AI Customer Service" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastHost>
          <SessionProvider>
            <WorkspaceProvider>
              <Nav />
              <div className="page">{children}</div>
              <footer className="footer">
                <div className="footer-inner">
                  <span><b style={{ color: "#ffedd5" }}>Warmdesk</b> — AI customer service, student-built.</span>
                  <span style={{ flex: 1 }} />
                  <a href="/workspaces">Product</a>
                  <a href="/knowledge">Knowledge</a>
                  <a href="/analytics">Analytics</a>
                  <a href="/login">Sign in</a>
                </div>
              </footer>
            </WorkspaceProvider>
          </SessionProvider>
        </ToastHost>
      </body>
    </html>
  );
}
