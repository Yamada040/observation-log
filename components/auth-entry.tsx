"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type AuthMeResponse = {
  user: { id: string; email: string; displayName: string };
};

export function AuthEntry() {
  const router = useRouter();
  const { showToast } = useToast();

  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Tokyo");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          setStatus("unauthenticated");
          return;
        }
        const data = (await res.json()) as AuthMeResponse;
        setEmail(data.user.email);
        setDisplayName(data.user.displayName);
        setStatus("authenticated");
      } catch {
        setStatus("unauthenticated");
      }
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    showToast("ログアウトしました", "info");
    setStatus("unauthenticated");
    setStep("request");
    setCode("");
    setDevCode(null);
    router.refresh();
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, displayName, timezone })
      });

      const body = (await res.json()) as {
        devCode?: string;
        message?: string;
        delivered?: boolean;
        transport?: "smtp" | "dev-fallback";
      };
      if (!res.ok) {
        throw new Error(body.message || "認証コード発行に失敗しました");
      }

      setDevCode(body.devCode ?? null);
      setStep("verify");

      if (body.delivered) {
        showToast(`認証コードを送信しました (${body.transport})`, "success");
      } else {
        showToast("メール設定が未完了です。開発用コードを利用してください", "info");
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "認証コード発行に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      });

      const body = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(body.message || "ログインに失敗しました");
      }

      showToast("ログインしました", "success");
      router.push("/observations");
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ログインに失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return <div className="panel">セッション確認中...</div>;
  }

  if (status === "authenticated") {
    return (
      <div className="panel grid" style={{ gap: 12 }}>
        <h1>ログイン済み</h1>
        <p className="muted">{displayName || email} でサインインしています。</p>
        <div className="row">
          <Link href="/observations" className="nav-link is-active">観察一覧へ</Link>
          <button onClick={logout}>ログアウト</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel grid" style={{ gap: 14 }}>
      <h1>ログイン</h1>
      <p className="muted">メール認証コードでログイン</p>

      {step === "request" && (
        <form className="grid" style={{ gap: 10 }} onSubmit={requestCode}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="表示名（任意）" />
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Tokyo" />
          <button type="submit" disabled={loading}>{loading ? "送信中..." : "認証コードを送信"}</button>
        </form>
      )}

      {step === "verify" && (
        <form className="grid" style={{ gap: 10 }} onSubmit={verifyCode}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6桁コード" />
          {devCode && <div className="muted">開発用コード: {devCode}</div>}
          <div className="row">
            <button type="button" onClick={() => setStep("request")}>戻る</button>
            <button type="submit" disabled={loading}>{loading ? "確認中..." : "ログイン"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
