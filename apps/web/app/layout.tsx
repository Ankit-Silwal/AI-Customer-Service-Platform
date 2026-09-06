import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Warmdesk — AI Customer Service" };

const links = [
  ["Login", "/login"],
  ["Register", "/register"],
  ["Workspaces", "/workspaces"],
  ["Knowledge", "/knowledge"],
  ["Chats", "/conversations"],
  ["Tickets", "/tickets"],
  ["Analytics", "/analytics"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <a className="brand" href="/">
            <span className="dot" /> Warmdesk
          </a>
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
