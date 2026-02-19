"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/client";
import { Confidence, Observation, ObservationStatus, Project, Tag } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

type ListResponse = {
  items: Observation[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

type ProjectsResponse = { items: Project[] };
type TagsResponse = { items: Tag[] };

const PER_PAGE = 20;

export default function ObservationListPage() {
  const { showToast } = useToast();

  const [items, setItems] = useState<Observation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [page, setPage] = useState(1);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ObservationStatus>("");
  const [confidence, setConfidence] = useState<"" | Confidence>("");
  const [tag, setTag] = useState("");
  const [projectId, setProjectId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [meta, setMeta] = useState({ page: 1, perPage: PER_PAGE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [p, t] = await Promise.all([
          apiFetch<ProjectsResponse>("/api/meta/projects"),
          apiFetch<TagsResponse>("/api/meta/tags")
        ]);
        setProjects(p.items);
        setTags(t.items);
      } catch {
        showToast("タグ/プロジェクト情報の取得に失敗しました", "error");
      }
    })();
  }, [showToast]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("perPage", String(PER_PAGE));
    p.set("sortBy", sortBy);
    p.set("sortOrder", sortOrder);

    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (confidence) p.set("confidence", confidence);
    if (tag.trim()) p.set("tag", tag.trim());
    if (projectId.trim()) p.set("projectId", projectId.trim());
    if (dateFrom) p.set("dateFrom", dateFrom);
    if (dateTo) p.set("dateTo", dateTo);

    return p.toString();
  }, [page, q, status, confidence, tag, projectId, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await apiFetch<ListResponse>(`/api/observations?${queryString}`);
        if (!canceled) {
          setItems(data.items);
          setMeta(data.meta);
        }
      } catch (e) {
        if (!canceled) {
          showToast(e instanceof Error ? e.message : "読み込みに失敗しました", "error");
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      canceled = true;
    };
  }, [queryString, showToast]);

  function resetFilters() {
    setQ("");
    setStatus("");
    setConfidence("");
    setTag("");
    setProjectId("");
    setDateFrom("");
    setDateTo("");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setPage(1);
    showToast("フィルタを解除しました", "info");
  }

  return (
    <main className="grid" style={{ gap: 16 }}>
      <h1>観察一覧</h1>

      <div className="panel grid" style={{ gap: 10 }}>
        <div className="row">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="キーワード検索"
            style={{ flex: 1 }}
          />
          <button onClick={resetFilters}>フィルタ解除</button>
        </div>

        <div className="row" style={{ flexWrap: "wrap" }}>
          <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
            <option value="">Status: All</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>

          <select value={confidence} onChange={(e) => { setConfidence(e.target.value as typeof confidence); setPage(1); }}>
            <option value="">Confidence: All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select value={tag} onChange={(e) => { setTag(e.target.value); setPage(1); }}>
            <option value="">Tag: All</option>
            {tags.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          <select value={projectId} onChange={(e) => { setProjectId(e.target.value); setPage(1); }}>
            <option value="">Project: All</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <label>
            From
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </label>
          <label>
            To
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </label>

          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}>
            <option value="updatedAt">Sort: Updated</option>
            <option value="createdAt">Sort: Created</option>
          </select>
          <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as typeof sortOrder); setPage(1); }}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="muted">
        {meta.total} 件 / {meta.page} / {meta.totalPages} ページ
      </div>

      {loading && <div className="panel">読み込み中...</div>}

      {!loading && items.length === 0 && (
        <div className="card">
          <p className="muted">検索結果が0件です。フィルタ解除または新規作成を試してください。</p>
        </div>
      )}

      <div className="grid" style={{ gap: 10 }}>
        {items.map((item) => (
          <Link key={item.id} href={`/observations/${item.id}`} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{item.title || "Untitled"}</strong>
              <span className="muted">{new Date(item.updatedAt).toLocaleString()}</span>
            </div>
            <div className="row muted">
              <span>{item.status}</span>
              <span>{item.confidence}</span>
              <span>{projects.find((p) => p.id === item.projectId)?.name || "(no project)"}</span>
              <span>{item.tags.join(", ") || "(no tags)"}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <button disabled={meta.page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>前へ</button>
        <button disabled={meta.page >= meta.totalPages || loading} onClick={() => setPage((p) => p + 1)}>次へ</button>
      </div>
    </main>
  );
}
