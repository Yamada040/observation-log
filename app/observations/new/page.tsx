"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client";
import { Observation, Project, Tag } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

type CreateResponse = { item: Observation };
type ProjectsResponse = { items: Project[] };
type TagsResponse = { items: Tag[] };

export default function NewObservationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [observation, setObservation] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [context, setContext] = useState("where=office\ndevice=macbook");
  const [status, setStatus] = useState<"Draft" | "Active" | "Archived">("Draft");
  const [confidence, setConfidence] = useState<"Low" | "Medium" | "High">("Medium");
  const [projectId, setProjectId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsText, setTagsText] = useState("");
  const [linksText, setLinksText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);

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

  const manualTags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    [tagsText]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const contextItems = context
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [key, ...rest] = line.split("=");
          return { key: key?.trim() || "", value: rest.join("=").trim() };
        })
        .filter((x) => x.key && x.value);

      const selectedTagNames = tags.filter((t) => selectedTags.includes(t.id)).map((t) => t.name);
      const mergedTags = [...new Set([...selectedTagNames, ...manualTags])];

      const links = linksText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((line) => {
          const [url, ...titleParts] = line.split("|");
          return {
            url: url.trim(),
            title: titleParts.join("|").trim() || undefined
          };
        })
        .filter((x) => x.url.length > 0);

      const data = await apiFetch<CreateResponse>("/api/observations", {
        method: "POST",
        body: JSON.stringify({
          title,
          observation,
          context: contextItems,
          interpretation,
          nextAction,
          status,
          confidence,
          projectId: projectId.trim() || null,
          tags: mergedTags,
          links
        })
      });

      showToast("観察を保存しました", "success");
      router.push(`/observations/${data.item.id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
  }

  return (
    <main className="grid grid-2">
      <form className="panel grid" style={{ gap: 12 }} onSubmit={onSubmit}>
        <h1>新規観察</h1>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル" />
        <textarea value={observation} onChange={(e) => setObservation(e.target.value)} placeholder="Observation" rows={5} />
        <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="context key=value" rows={4} />
        <textarea value={interpretation} onChange={(e) => setInterpretation(e.target.value)} placeholder="Interpretation" rows={5} />
        <textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next Action" rows={4} />
        <button type="submit" disabled={saving}>{saving ? "保存中..." : "保存"}</button>
      </form>
      <aside className="panel grid" style={{ gap: 10 }}>
        <h2>メタ情報</h2>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option>Draft</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
        </label>
        <label>
          Confidence
          <select value={confidence} onChange={(e) => setConfidence(e.target.value as typeof confidence)}>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>
        <label>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">(none)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <div className="grid" style={{ gap: 6 }}>
          <span>Tags</span>
          {tags.length === 0 && <span className="muted">登録タグなし</span>}
          {tags.map((tag) => (
            <label key={tag.id} className="row" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.id)}
                onChange={() => toggleTag(tag.id)}
                style={{ width: 16 }}
              />
              <span>{tag.name}</span>
            </label>
          ))}
        </div>

        <label>
          Manual Tags
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="bug, learning, infra" />
        </label>
        <label>
          Links
          <textarea
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            placeholder={"https://example.com|資料タイトル\nhttps://example.org"}
            rows={4}
          />
        </label>
      </aside>
    </main>
  );
}
