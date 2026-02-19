"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AuthState = {
  loggedIn: boolean;
  email?: string;
};

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/observations", label: "Observations" },
  { href: "/observations/new", label: "New" },
  { href: "/settings", label: "Settings" }
];

export function AppHeader() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          setAuth({ loggedIn: false });
          return;
        }
        const body = (await res.json()) as { user?: { email?: string } };
        setAuth({ loggedIn: true, email: body.user?.email });
      } catch {
        setAuth({ loggedIn: false });
      }
    })();
  }, [pathname]);

  const links = useMemo(() => {
    if (auth.loggedIn) {
      return baseLinks;
    }
    return [...baseLinks, { href: "/login", label: "Login" }];
  }, [auth.loggedIn]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="global-header">
      <div className="global-header-inner">
        <Link href="/" className="brand-wrap">
          <span className="brand-kicker">Knowledge Ops</span>
          <span className="brand-title">Observation Log</span>
        </Link>

        <nav className="global-nav" aria-label="Main Navigation">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={active ? "nav-link is-active" : "nav-link"}>
                {link.label}
              </Link>
            );
          })}
          {auth.loggedIn && <button onClick={logout}>Logout</button>}
        </nav>
      </div>
    </header>
  );
}
