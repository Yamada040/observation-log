"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { Attachment, Observation } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

type DetailResponse = { item: Observation };

export default function ObservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id;

  const [item, setItem] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [observationText, setObservationText] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [contextText, setContextText] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tagsText, setTagsText] = useState("");

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  function syncForm(source: Observation) {
    setTitle(source.title);
    setObservationText(source.observation);
    setInterpretation(source.interpretation);
    setNextAction(source.nextAction);
    setContextText(source.context.map((c) => `${c.key}=${c.value}`).join("\n"));
    setProjectId(source.projectId ?? "");
    setTagsText(source.tags.join(", "));
  }

  useEffect(() => {
    let canceled = false;

    async function load() {
      try {
        const data = await apiFetch<DetailResponse>(`/api/observations/${id}`);
        if (!canceled) {
          setItem(data.item);
          syncForm(data.item);
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
  }, [id, showToast]);

  async function refreshObservation() {
    const data = await apiFetch<DetailResponse>(`/api/observations/${id}`);
    setItem(data.item);
    syncForm(data.item);
  }

  async function updateStatus(status: Observation["status"]) {
    if (!item) return;

    try {
      const data = await apiFetch<DetailResponse>(`/api/observations/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setItem(data.item);
      syncForm(data.item);
      showToast(`ステータスを ${status} に更新しました`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "状態更新に失敗しました", "error");
    }
  }

  async function saveEdit() {
    if (!item) return;

    setSaving(true);
    try {
      const context = contextText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return { key: key?.trim() || "", value: rest.join("=").trim() };
        })
        .filter((x) => x.key && x.value);

      const tags = tagsText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      const data = await apiFetch<DetailResponse>(`/api/observations/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          observation: observationText,
          interpretation,
          nextAction,
          context,
          projectId: projectId.trim() || null,
          tags
        })
      });

      setItem(data.item);
      syncForm(data.item);
      setIsEditing(false);
      showToast("観察を更新しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "編集保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteObservation() {
    if (!item) return;
    if (!window.confirm("この観察を削除しますか？")) return;

    setDeleting(true);
    try {
      await apiFetch(`/api/observations/${item.id}`, { method: "DELETE" });
      showToast("観察を削除しました", "success");
      router.push("/observations");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "削除に失敗しました", "error");
      setDeleting(false);
    }
  }

  async function uploadAttachment(e: ChangeEvent<HTMLInputElement>) {
    if (!item) return;

    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch(`/api/observations/${item.id}/attachments`, {
        method: "POST",
        body,
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(data.message || "Upload failed");
      }

      const data = (await res.json()) as { attachment: Attachment };
      setItem({ ...item, attachments: [data.attachment, ...item.attachments] });
      e.target.value = "";
      showToast("添付をアップロードしました", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "添付アップロードに失敗しました", "error");
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment(attachmentId: string) {
    if (!item) return;

    try {
      const res = await fetch(`/api/observations/${item.id}/attachments/${attachmentId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Delete failed" }));
        throw new Error(data.message || "Delete failed");
      }

      setItem({ ...item, attachments: item.attachments.filter((a) => a.id !== attachmentId) });
      showToast("添付を削除しました", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "添付削除に失敗しました", "error");
    }
  }

  async function saveLinks(links: Observation["links"]) {
    if (!item) return;

    const data = await apiFetch<DetailResponse>(`/api/observations/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ links })
    });
    setItem(data.item);
  }

  async function addLink() {
    if (!item) return;

    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      showToast("リンクURLを入力してください", "error");
      return;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      showToast("有効なURLを入力してください", "error");
      return;
    }

    try {
      const nextLinks = [{ url: trimmedUrl, title: linkTitle.trim() || undefined }, ...item.links];
      await saveLinks(nextLinks);
      setLinkUrl("");
      setLinkTitle("");
      await refreshObservation();
      showToast("リンクを追加しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "リンク追加に失敗しました", "error");
    }
  }

  async function removeLink(targetUrl: string) {
    if (!item) return;
    try {
      const nextLinks = item.links.filter((l) => l.url !== targetUrl);
      await saveLinks(nextLinks);
      await refreshObservation();
      showToast("リンクを削除しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "リンク削除に失敗しました", "error");
    }
  }

  function attachmentUrl(attachmentId: string): string {
    return `/api/observations/${id}/attachments/${attachmentId}`;
  }

  if (loading) return <main className="panel">読み込み中...</main>;
  if (!item) return <main className="panel">データが見つかりません</main>;

  return (
    <main className="grid" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>{item.title || "Untitled"}</h1>
        <div className="row">
          <button onClick={() => updateStatus("Active")}>Active</button>
          <button onClick={() => updateStatus("Archived")}>Archive</button>
          <button onClick={() => { setIsEditing((v) => !v); syncForm(item); }}>{isEditing ? "編集閉じる" : "編集"}</button>
          <button onClick={deleteObservation} disabled={deleting}>{deleting ? "削除中..." : "削除"}</button>
        </div>
      </div>

      {isEditing && (
        <div className="panel grid" style={{ gap: 10 }}>
          <strong>編集フォーム</strong>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
          <textarea value={observationText} onChange={(e) => setObservationText(e.target.value)} rows={4} placeholder="Observation" />
          <textarea value={contextText} onChange={(e) => setContextText(e.target.value)} rows={4} placeholder="context key=value" />
          <textarea value={interpretation} onChange={(e) => setInterpretation(e.target.value)} rows={4} placeholder="Interpretation" />
          <textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} rows={4} placeholder="Next Action" />
          <input value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="project id" />
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="tag1, tag2" />
          <div className="row">
            <button onClick={saveEdit} disabled={saving}>{saving ? "保存中..." : "保存"}</button>
            <button onClick={() => { setIsEditing(false); syncForm(item); }}>キャンセル</button>
          </div>
        </div>
      )}

      <div className="panel">
        <strong>Context</strong>
        <ul>
          {item.context.map((c) => (
            <li key={`${c.key}:${c.value}`}>{c.key}: {c.value}</li>
          ))}
        </ul>
      </div>

      <div className="panel"><strong>Observation</strong><p>{item.observation}</p></div>
      <div className="panel"><strong>Interpretation</strong><p>{item.interpretation}</p></div>
      <div className="panel"><strong>Next Action</strong><p>{item.nextAction}</p></div>

      <div className="panel grid" style={{ gap: 10 }}>
        <strong>Attachments</strong>
        <input type="file" accept="image/*,.pdf,.csv" onChange={uploadAttachment} disabled={uploading} />
        <p className="muted">画像 / PDF / CSV のみ。{uploading ? "アップロード中..." : ""}</p>

        {item.attachments.length === 0 && <div className="muted">添付なし</div>}

        {item.attachments.map((attachment) => (
          <div key={attachment.id} className="panel grid" style={{ gap: 8 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <a href={attachmentUrl(attachment.id)} target="_blank" rel="noreferrer">
                {attachment.fileName} ({attachment.kind}, {attachment.size} bytes)
              </a>
              <div className="row">
                <a href={attachmentUrl(attachment.id)} download>ダウンロード</a>
                <button onClick={() => deleteAttachment(attachment.id)}>削除</button>
              </div>
            </div>

            {attachment.kind === "image" && (
              <img src={attachmentUrl(attachment.id)} alt={attachment.fileName} style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain", border: "1px solid #d9e0ea", borderRadius: 8 }} />
            )}

            {attachment.kind === "pdf" && (
              <iframe src={attachmentUrl(attachment.id)} title={attachment.fileName} style={{ width: "100%", height: 420, border: "1px solid #d9e0ea", borderRadius: 8 }} />
            )}

            {attachment.kind === "csv" && <div className="muted">CSVはダウンロードして確認してください。</div>}
          </div>
        ))}
      </div>

      <div className="panel grid" style={{ gap: 10 }}>
        <strong>Links</strong>
        <div className="row">
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" style={{ flex: 1 }} />
          <input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="タイトル（任意）" style={{ flex: 1 }} />
          <button onClick={addLink}>追加</button>
        </div>
        {item.links.length === 0 && <div className="muted">リンクなし</div>}
        {item.links.map((link, index) => (
          <div key={`${link.url}-${index}`} className="row" style={{ justifyContent: "space-between" }}>
            <a href={link.url} target="_blank" rel="noreferrer">{link.title || link.url}</a>
            <button onClick={() => removeLink(link.url)}>削除</button>
          </div>
        ))}
      </div>

      <div className="row">
        <Link href="/observations">一覧へ戻る</Link>
        <a href={`/api/export/observation/${item.id}`} target="_blank" rel="noreferrer">Markdownエクスポート</a>
      </div>
    </main>
  );
}
