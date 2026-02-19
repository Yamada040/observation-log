"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import { Project, Tag, User } from "@/lib/types";
import { useToast } from "@/components/toast-provider";

type MeResponse = { user: User };
type ProjectsResponse = { items: Project[] };
type TagsResponse = { items: Tag[] };

export default function SettingsPage() {
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Tokyo");

  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newProject, setNewProject] = useState("");
  const [newTag, setNewTag] = useState("");

  async function loadMeta() {
    const [p, t] = await Promise.all([
      apiFetch<ProjectsResponse>("/api/meta/projects"),
      apiFetch<TagsResponse>("/api/meta/tags")
    ]);
    setProjects(p.items);
    setTags(t.items);
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<MeResponse>("/api/auth/me");
        setUser(data.user);
        setDisplayName(data.user.displayName);
        setTimezone(data.user.timezone);
        await loadMeta();
      } catch (e) {
        showToast(e instanceof Error ? e.message : "読み込みに失敗しました", "error");
      }
    })();
  }, [showToast]);

  async function saveProfile() {
    try {
      const data = await apiFetch<MeResponse>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName, timezone })
      });
      setUser(data.user);
      showToast("プロフィールを保存しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "プロフィール保存に失敗しました", "error");
    }
  }

  async function addProject() {
    if (!newProject.trim()) return;
    try {
      await apiFetch("/api/meta/projects", {
        method: "POST",
        body: JSON.stringify({ name: newProject.trim() })
      });
      setNewProject("");
      await loadMeta();
      showToast("プロジェクトを追加しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "プロジェクト追加に失敗しました", "error");
    }
  }

  async function removeProject(id: string) {
    try {
      await apiFetch(`/api/meta/projects/${id}`, { method: "DELETE" });
      await loadMeta();
      showToast("プロジェクトを削除しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "プロジェクト削除に失敗しました", "error");
    }
  }

  async function addTag() {
    if (!newTag.trim()) return;
    try {
      await apiFetch("/api/meta/tags", {
        method: "POST",
        body: JSON.stringify({ name: newTag.trim() })
      });
      setNewTag("");
      await loadMeta();
      showToast("タグを追加しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "タグ追加に失敗しました", "error");
    }
  }

  async function removeTag(id: string) {
    try {
      await apiFetch(`/api/meta/tags/${id}`, { method: "DELETE" });
      await loadMeta();
      showToast("タグを削除しました", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "タグ削除に失敗しました", "error");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (!user) {
    return <main className="panel">読み込み中...</main>;
  }

  return (
    <main className="grid" style={{ gap: 16, maxWidth: 960 }}>
      <h1>設定</h1>

      <div className="panel grid" style={{ gap: 10 }}>
        <h2>プロフィール</h2>
        <label>
          Email
          <input value={user.email} readOnly />
        </label>
        <label>
          Display Name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label>
          Timezone
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>
        <div className="row">
          <button onClick={saveProfile}>保存</button>
          <button onClick={logout}>ログアウト</button>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel grid" style={{ gap: 10 }}>
          <h2>プロジェクト管理</h2>
          <div className="row">
            <input value={newProject} onChange={(e) => setNewProject(e.target.value)} placeholder="project-alpha" />
            <button onClick={addProject}>追加</button>
          </div>
          {projects.length === 0 && <div className="muted">プロジェクトなし</div>}
          {projects.map((p) => (
            <div key={p.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>{p.name}</span>
              <button onClick={() => removeProject(p.id)}>削除</button>
            </div>
          ))}
        </div>

        <div className="panel grid" style={{ gap: 10 }}>
          <h2>タグ管理</h2>
          <div className="row">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="learning" />
            <button onClick={addTag}>追加</button>
          </div>
          {tags.length === 0 && <div className="muted">タグなし</div>}
          {tags.map((t) => (
            <div key={t.id} className="row" style={{ justifyContent: "space-between" }}>
              <span>{t.name}</span>
              <button onClick={() => removeTag(t.id)}>削除</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
