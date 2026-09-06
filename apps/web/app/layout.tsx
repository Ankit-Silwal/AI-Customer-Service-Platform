import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider, ToastHost, WorkspaceProvider } from "../lib/app-state";
import Nav from "./nav";
import Footer from "./footer";

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
              <Footer />
            </WorkspaceProvider>
          </SessionProvider>
        </ToastHost>
      </body>
    </html>
  );
}
