"use client";

import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { InstallSignIn } from "@/components/InstallSignIn";
import { AuthProvider } from "@/lib/auth";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-install-display",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-install-sans",
});

function LoginShell() {
  return (
    <div className={`${display.variable} ${sans.variable} install-home`}>
      <section className="install-stage install-stage--login">
        <div className="install-stage__atmosphere" aria-hidden>
          <span className="install-orb install-orb--a" />
          <span className="install-orb install-orb--b" />
          <span className="install-stage__sparkles" />
        </div>

        <div className="install-stage__logo animate-logo" aria-hidden>
          <Image
            src="/brand/goodfaith-logo.png"
            alt=""
            width={1024}
            height={1024}
            priority
            className="install-stage__logo-img"
          />
        </div>

        <div className="install-stage__content install-stage__content--login">
          <header className="install-stage__copy animate-rise">
            <Link href="/" className="install-back">
              ← Home
            </Link>
            <p className="install-brand">Good Faith</p>
            <h1 className="install-title animate-rise animate-rise-delay-1">
              Record Management
            </h1>
            <p className="install-lead animate-rise animate-rise-delay-2">
              Sign in to your self-hosted label portal.
            </p>
          </header>

          <div className="install-stage__panel animate-rise animate-rise-delay-2">
            <InstallSignIn />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginShell />
    </AuthProvider>
  );
}
