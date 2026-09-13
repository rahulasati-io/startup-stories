import { ImageResponse } from "next/og";
import { defineQuery } from "next-sanity";
import {
  getBusinessModelPalette,
  getBusinessModelPattern,
  isBusinessModelCategory,
  type ThumbnailPalette,
} from "@/lib/business-model-thumbnail";
import { client } from "@/sanity/lib/client";

export const runtime = "nodejs";

const THUMBNAIL_QUERY = defineQuery(/* groq */ `
  *[
    _type == "post" &&
    slug.current == $slug &&
    category->slug.current == $category
  ][0] {
    title,
    "companyName": coalesce(company[0]->name, "MisterStory"),
    "industry": coalesce(company[0]->industryCategory->name, company[0]->industry)
  }
`);

type ThumbnailArticle = {
  title: string;
  companyName: string;
  industry?: string;
};

function titleSize(title: string) {
  if (title.length > 72) return 54;
  if (title.length > 52) return 62;
  if (title.length > 34) return 72;
  return 82;
}

function DecorativePattern({ pattern, palette }: { pattern: number; palette: ThumbnailPalette }) {
  const shell = { display: "flex", position: "absolute" as const, right: 42, top: 142, width: 330, height: 380, borderRadius: 42, background: palette.panel, padding: 32 };
  const label = { display: "flex", fontSize: 17, fontWeight: 800, letterSpacing: 2, color: palette.foreground };

  if (pattern === 1) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={label}>MARKETPLACE</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>{[0, 1, 2].map((item) => <div key={item} style={{ width: 42, height: 42, borderRadius: 21, background: palette.background, border: `7px solid ${palette.accent}` }} />)}</div>
        <div style={{ display: "flex", width: 132, height: 132, borderRadius: 34, alignItems: "center", justifyContent: "center", background: palette.accent, color: palette.background, fontSize: 22, fontWeight: 900 }}>PLATFORM</div>
      </div>
      <div style={{ ...label, alignSelf: "flex-end" }}>BUYERS ↔ SELLERS</div>
    </div>
  );
  if (pattern === 2) return (
    <div style={{ ...shell, flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ ...label, alignSelf: "flex-start" }}>RECURRING REVENUE</div>
      <div style={{ display: "flex", width: 230, height: 230, borderRadius: 115, border: `34px solid ${palette.accent}`, alignItems: "center", justifyContent: "center", background: palette.background }}><div style={{ display: "flex", fontSize: 58, fontWeight: 900 }}>↻</div></div>
      <div style={label}>SUBSCRIBE • RENEW</div>
    </div>
  );
  if (pattern === 3) return (
    <div style={{ ...shell, flexDirection: "column", gap: 24 }}>
      <div style={label}>PRODUCT PORTFOLIO</div>
      {["CORE", "ADJACENT", "NEW"].map((item, index) => <div key={item} style={{ display: "flex", width: 250 - index * 24, height: 70, marginLeft: index * 24, borderRadius: 20, alignItems: "center", paddingLeft: 25, background: index === 0 ? palette.accent : palette.background, color: index === 0 ? palette.background : palette.foreground, fontSize: 19, fontWeight: 900, letterSpacing: 2 }}>{item}</div>)}
    </div>
  );
  if (pattern === 4) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={label}>TRANSACTION MODEL</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", fontSize: 150, lineHeight: 1, fontWeight: 900, color: palette.accent }}>%</div><div style={{ display: "flex", flexDirection: "column", gap: 15 }}>{[46, 62, 78].map((size) => <div key={size} style={{ width: size, height: size, borderRadius: size / 2, background: palette.background, border: `8px solid ${palette.accent}` }} />)}</div></div>
      <div style={label}>FEE ON EVERY FLOW</div>
    </div>
  );
  if (pattern === 5) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={label}>GROWTH ENGINE</div>
      <div style={{ display: "flex", height: 245, alignItems: "flex-end", gap: 17 }}>{[70, 110, 155, 205, 245].map((height, index) => <div key={height} style={{ display: "flex", width: 38, height, borderRadius: 12, background: index === 4 ? palette.accent : palette.background }} />)}</div>
      <div style={{ ...label, alignSelf: "flex-end" }}>SCALE ↑</div>
    </div>
  );
  if (pattern === 6) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>NETWORK EXCHANGE</div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{[0, 1, 2].map((item) => <div key={item} style={{ width: 46, height: 46, borderRadius: 23, background: palette.background, border: `7px solid ${palette.accent}` }} />)}</div><div style={{ display: "flex", width: 9, height: 180, background: palette.accent, borderRadius: 5 }} /><div style={{ display: "flex", flexDirection: "column", gap: 28 }}>{[0, 1, 2].map((item) => <div key={item} style={{ width: 46, height: 46, borderRadius: 13, background: palette.accent }} />)}</div></div><div style={label}>SUPPLY ↔ DEMAND</div></div>
  );
  if (pattern === 7) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>FULFILMENT ROUTE</div><div style={{ display: "flex", position: "relative", height: 220, alignItems: "center", justifyContent: "space-between" }}><div style={{ display: "flex", width: 66, height: 66, borderRadius: 18, background: palette.accent }} /><div style={{ display: "flex", width: 145, height: 12, borderRadius: 6, background: palette.background }} /><div style={{ display: "flex", width: 72, height: 72, borderRadius: 36, border: `12px solid ${palette.accent}` }} /><div style={{ display: "flex", position: "absolute", left: 105, top: 61, fontSize: 42, fontWeight: 900 }}>→</div></div><div style={label}>ORDER TO DOOR</div></div>
  );
  if (pattern === 8) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>STORE + DIGITAL</div><div style={{ display: "flex", gap: 26, alignItems: "center" }}><div style={{ display: "flex", width: 118, height: 150, borderRadius: 24, background: palette.background, borderTop: `32px solid ${palette.accent}` }} /><div style={{ display: "flex", fontSize: 48, fontWeight: 900 }}>+</div><div style={{ display: "flex", width: 92, height: 156, borderRadius: 20, border: `10px solid ${palette.accent}`, alignItems: "flex-end", justifyContent: "center", paddingBottom: 14 }}><div style={{ display: "flex", width: 35, height: 7, borderRadius: 4, background: palette.accent }} /></div></div><div style={label}>OMNICHANNEL SALES</div></div>
  );
  if (pattern === 9) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>RENEWAL CYCLE</div><div style={{ display: "flex", width: 250, height: 205, alignSelf: "center", borderRadius: 28, background: palette.background, borderTop: `42px solid ${palette.accent}`, alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", fontSize: 74, fontWeight: 900 }}>↻</div></div><div style={label}>MONTH AFTER MONTH</div></div>
  );
  if (pattern === 10) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>MEMBERSHIP TIERS</div><div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center" }}>{["FREE", "PLUS", "PREMIUM"].map((item, index) => <div key={item} style={{ display: "flex", width: 170 + index * 42, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", background: index === 2 ? palette.accent : palette.background, color: index === 2 ? palette.background : palette.foreground, fontSize: 17, fontWeight: 900, letterSpacing: 2 }}>{item}</div>)}</div><div style={label}>UPGRADE VALUE</div></div>
  );
  if (pattern === 11) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>BUSINESS SEGMENTS</div><div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>{[115, 170, 225].map((height, index) => <div key={height} style={{ display: "flex", width: 76, height, borderRadius: "38px 38px 18px 18px", background: index === 1 ? palette.accent : palette.background }} />)}</div><div style={label}>MIX OF REVENUE</div></div>
  );
  if (pattern === 12) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>VALUE CHAIN</div><div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{["MAKE", "MOVE", "SELL"].map((item, index) => <div key={item} style={{ display: "flex", width: 255, height: 62, borderRadius: 18, paddingLeft: 24, alignItems: "center", background: index === 2 ? palette.accent : palette.background, color: index === 2 ? palette.background : palette.foreground, fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>{item}<div style={{ display: "flex", marginLeft: "auto", marginRight: 18 }}>→</div></div>)}</div><div style={label}>END-TO-END MARGIN</div></div>
  );
  if (pattern === 13) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>BUSINESS ECOSYSTEM</div><div style={{ display: "flex", width: 245, height: 245, alignSelf: "center", borderRadius: 123, border: `22px solid ${palette.background}`, alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", width: 125, height: 125, borderRadius: 63, background: palette.accent, alignItems: "center", justifyContent: "center", color: palette.background, fontSize: 19, fontWeight: 900 }}>CORE</div></div><div style={label}>ONE CORE, MANY LAYERS</div></div>
  );
  if (pattern === 14) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>COMMISSION SPLIT</div><div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ display: "flex", height: 70, borderRadius: 22, overflow: "hidden" }}><div style={{ display: "flex", width: 190, background: palette.background }} /><div style={{ display: "flex", width: 76, background: palette.accent }} /></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900 }}><div style={{ display: "flex" }}>PARTNER</div><div style={{ display: "flex" }}>FEE</div></div></div><div style={{ display: "flex", alignSelf: "flex-end", fontSize: 74, fontWeight: 900, color: palette.accent }}>%</div></div>
  );
  if (pattern === 15) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>PAYMENT RAILS</div><div style={{ display: "flex", flexDirection: "column", gap: 22 }}>{[0, 1, 2].map((item) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ display: "flex", width: 46, height: 46, borderRadius: 23, background: palette.background }} /><div style={{ display: "flex", width: 145, height: 10, borderRadius: 5, background: palette.accent }} /><div style={{ display: "flex", fontSize: 32, fontWeight: 900 }}>₹</div></div>)}</div><div style={label}>VOLUME × TAKE RATE</div></div>
  );
  if (pattern === 16) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>CAPITAL ENGINE</div><div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14 }}>{[95, 125, 155, 185].map((size, index) => <div key={size} style={{ display: "flex", width: 46, height: size, borderRadius: 23, background: index === 3 ? palette.accent : palette.background, alignItems: "flex-start", justifyContent: "center", paddingTop: 14, fontSize: 20, fontWeight: 900 }}>₹</div>)}</div><div style={label}>CAPITAL → YIELD</div></div>
  );
  if (pattern === 17) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}><div style={{ ...label, alignSelf: "flex-start" }}>FLYWHEEL</div><div style={{ display: "flex", width: 235, height: 235, borderRadius: 118, border: `35px solid ${palette.accent}`, alignItems: "center", justifyContent: "center" }}><div style={{ display: "flex", width: 105, height: 105, borderRadius: 53, background: palette.background, alignItems: "center", justifyContent: "center", fontSize: 50, fontWeight: 900 }}>↻</div></div><div style={label}>USE → DATA → VALUE</div></div>
  );
  if (pattern === 18) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>SCALING NETWORK</div><div style={{ display: "flex", flexWrap: "wrap", gap: 22, alignItems: "center", justifyContent: "center" }}>{[42, 50, 58, 66, 74, 82, 90].map((size, index) => <div key={size} style={{ display: "flex", width: size, height: size, borderRadius: size / 2, background: index > 4 ? palette.accent : palette.background }} />)}</div><div style={label}>MORE NODES, MORE VALUE</div></div>
  );
  if (pattern === 19) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}><div style={{ ...label, alignSelf: "flex-start" }}>REVENUE FUNNEL</div><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>{[260, 205, 150, 95].map((width, index) => <div key={width} style={{ display: "flex", width, height: 48, borderRadius: 14, background: index === 3 ? palette.accent : palette.background }} />)}</div><div style={{ display: "flex", width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", background: palette.accent, color: palette.background, fontSize: 34, fontWeight: 900 }}>₹</div></div>
  );
  if (pattern === 20) return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}><div style={label}>MULTIPLE STREAMS</div><div style={{ display: "flex", flexDirection: "column", gap: 26 }}>{[210, 175, 135].map((width, index) => <div key={width} style={{ display: "flex", alignSelf: "flex-end", alignItems: "center", gap: 14 }}><div style={{ display: "flex", width, height: 16, borderRadius: 8, background: index === 0 ? palette.accent : palette.background }} /><div style={{ display: "flex", fontSize: 28, fontWeight: 900 }}>→</div></div>)}</div><div style={{ display: "flex", alignSelf: "flex-end", width: 150, height: 78, borderRadius: 22, alignItems: "center", justifyContent: "center", background: palette.accent, color: palette.background, fontSize: 23, fontWeight: 900 }}>REVENUE</div></div>
  );
  return (
    <div style={{ ...shell, flexDirection: "column", justifyContent: "space-between" }}>
      <div style={label}>REVENUE STREAMS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>{["PRODUCT", "SERVICE", "OTHER"].map((item, index) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 14 }}><div style={{ display: "flex", width: 105, fontSize: 16, fontWeight: 800 }}>{item}</div><div style={{ display: "flex", width: 95 + index * 36, height: 18, borderRadius: 9, background: index === 1 ? palette.accent : palette.background }} /></div>)}</div>
      <div style={{ display: "flex", alignSelf: "flex-end", width: 130, height: 76, borderRadius: 22, alignItems: "center", justifyContent: "center", background: palette.accent, color: palette.background, fontSize: 42, fontWeight: 900 }}>₹</div>
    </div>
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; slug: string }> },
) {
  const { category, slug } = await params;

  if (!isBusinessModelCategory(category)) {
    return new Response("Automatic thumbnail is not enabled for this category.", {
      status: 404,
    });
  }

  const article = await client.fetch<ThumbnailArticle | null>(
    THUMBNAIL_QUERY,
    { category, slug },
    { perspective: "published", stega: false },
  );

  if (!article) return new Response("Article not found.", { status: 404 });

  const palette = getBusinessModelPalette(article.companyName);
  const pattern = getBusinessModelPattern(article.companyName, article.industry);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 54px",
          background: palette.background,
          color: palette.foreground,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 18px",
              borderRadius: 999,
              background: palette.panel,
              color: palette.foreground,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2.5,
            }}
          >
            BUSINESS MODEL
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 3 }}>
            MISTERSTORY
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 700,
            fontSize: titleSize(article.title),
            lineHeight: 1.02,
            letterSpacing: -2.5,
            fontWeight: 800,
            zIndex: 2,
          }}
        >
          {article.title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 1.5 }}>
            {article.companyName.toUpperCase()}
          </div>
          <div style={{ display: "flex", width: 190, height: 10, borderRadius: 99, background: palette.accent }} />
        </div>

        <DecorativePattern pattern={pattern} palette={palette} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
