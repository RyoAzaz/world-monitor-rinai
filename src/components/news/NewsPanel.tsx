import { mockNewsItems } from "@/data/mockNews";
import type { NewsImpact } from "@/types/dashboard";

const impactClassName: Record<NewsImpact, string> = {
  高: "pill--high",
  中: "pill--medium",
  低: "pill--low",
};

export function NewsPanel() {
  return (
    <aside className="panel news-panel" aria-labelledby="news-panel-title">
      <div className="panel__header">
        <div>
          <h1 className="panel__title" id="news-panel-title">
            マーケットニュース
          </h1>
          <p className="panel__subtitle">地政学・金融政策・株式市場の注目材料</p>
        </div>
      </div>
      <div className="news-list">
        {mockNewsItems.map((item) => (
          <article className="news-item" key={item.id}>
            <div className="news-item__meta">
              <span className={`pill ${impactClassName[item.impact]}`}>
                影響度 {item.impact}
              </span>
              <span className="pill">{item.region}</span>
              <span className="pill">{item.category}</span>
            </div>
            <h2 className="news-item__headline">{item.headline}</h2>
            <p className="news-item__summary">{item.summary}</p>
            <div className="news-item__source">
              {item.source} ・ {item.publishedAt} JST
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
