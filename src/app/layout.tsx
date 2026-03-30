import "./globals.css";

export const metadata = {
  title: "Narrative CMS",
  description: "AI 연애 시뮬레이션 내러티브 제작 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header style={{ background: "#fff", borderBottom: "1px solid #ddd", padding: "12px 24px" }}>
          <div className="flex-between" style={{ maxWidth: 960, margin: "0 auto" }}>
            <a href="/" style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>
              Narrative CMS
            </a>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
