import { AuthEntry } from "@/components/auth-entry";

const cards = [
  {
    title: "観察を構造化して記録",
    body: "事実・解釈・次アクションを分けて保存し、後で再利用しやすくします。"
  },
  {
    title: "検索と絞り込みで再発見",
    body: "キーワード、ステータス、確度、タグ、プロジェクトで必要なログへすぐ到達できます。"
  },
  {
    title: "証跡を添付して残す",
    body: "画像/PDF/CSVやリンクを紐づけ、判断の根拠を後から追える形にします。"
  }
];

export default function HomePage() {
  return (
    <main className="grid grid-2" style={{ gap: 16 }}>
      <AuthEntry />

      <section className="grid" style={{ gap: 12 }}>
        {cards.map((card, idx) => (
          <article key={card.title} className={`card feature-card feature-${idx + 1}`}>
            <h2>{card.title}</h2>
            <p className="muted" style={{ marginTop: 8 }}>{card.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
