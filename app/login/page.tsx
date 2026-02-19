import { AuthEntry } from "@/components/auth-entry";

export default function LoginPage() {
  return (
    <main className="grid" style={{ maxWidth: 640, margin: "80px auto", gap: 16 }}>
      <AuthEntry />
    </main>
  );
}
