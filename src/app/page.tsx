"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { scripts: number };
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/projects");
    setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("프로젝트를 삭제하시겠습니까?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1>프로젝트</h1>

      <form onSubmit={handleCreate} className="card">
        <label>새 프로젝트</label>
        <div className="flex">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트 이름"
            style={{ marginBottom: 0 }}
          />
          <button type="submit" className="btn-primary">생성</button>
        </div>
      </form>

      <div className="mt-16">
        {loading && <p>로딩 중...</p>}
        {!loading && projects.length === 0 && <p>프로젝트가 없습니다.</p>}
        {projects.map((p) => (
          <div key={p.id} className="card flex-between">
            <div>
              <a href={`/projects/${p.id}`} style={{ fontWeight: 600, fontSize: 16 }}>
                {p.name}
              </a>
              <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                <span className="badge">{p._count.scripts} scripts</span>
                {" · "}
                {new Date(p.createdAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <button className="btn-danger" onClick={() => handleDelete(p.id)}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}
