"use client";
import Link from "next/link";
import { useState } from "react";
import Studio from "./Studio";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Command,
  LayoutDashboard,
  ScanLine,
  Hand,
  SlidersHorizontal,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const home = path === "/";
  const [menuOpen,setMenuOpen]=useState(false);
  return (
    <>
      <header className={"topbar " + (home ? "home-topbar" : "")}>
        <Link href="/" className="brand">
          <span className="brandmark">
            <Command size={21} />
          </span>
          Airctrl
        </Link>
        <nav aria-label="Main navigation" className={"toplinks " + (home && menuOpen ? "home-menu-open" : "")} onClick={()=>setMenuOpen(false)}>
          {home ? (
            <>
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <Link href="/privacy">Accessibility</Link>
            </>
          ) : (
            <>
              <Link href="/studio">Workspace</Link>
              <Link href="/gestures">Gesture guide</Link>
              <Link href="/privacy">Privacy & access</Link>
            </>
          )}
        </nav>
        {home && <button className="air-menu-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>}
        <div className="topactions">
          <Link href="/auth/sign-in" className="signin">
            Sign in
          </Link>
          <Link href="/studio" className="button smallbtn">
            Open studio <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
        <div className={home ? "" : "appbody"}>
          <aside className="sidebar" style={{display:home ? "none" : undefined}}>
            <span className="eyebrow">YOUR WORKSPACE</span>
            {[
              [ScanLine, "Control studio", "/studio"],
              [LayoutDashboard, "Overview", "/dashboard"],
              [Hand, "Gesture guide", "/gestures"],
              [SlidersHorizontal, "Preferences", "/settings"],
            ].map(([Icon, name, url]: any) => (
              <Link
                key={url}
                href={url}
                className={path === url ? "active" : ""}
              >
                <Icon size={19} />
                {name}
              </Link>
            ))}
            <div className="sidebarbottom">
              <ShieldCheck size={22} />
              <strong>Designed around you.</strong>
              <p>
                Your camera stays in your browser. Your control stays in your
                hands.
              </p>
              <Link href="/privacy">Our privacy approach ↗</Link>
            </div>
          </aside>
          <main className={home ? "" : "apppage"}><Studio />{path === "/studio" ? null : children}</main>
        </div>
      <footer className={home ? "home-footer" : undefined}>
        <Link className="brand" href="/">
          Airctrl
        </Link>
        <span>Your hands guide the cursor. Your voice takes control.</span>
        <Link href="/docs">Setup & source ↗</Link>
        <Link href="/privacy">Privacy & accessibility ↗</Link>
      </footer>
    </>
  );
}
