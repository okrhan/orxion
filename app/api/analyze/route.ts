// app/api/analyze/route.ts  (Next.js 13+ App Router)

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPrompt(data: Record<string, unknown>): string {
  const d = data as {
    name?: string;
    industry?: string;
    stage?: string;
    revenue?: string;
    costs?: string;
    cac?: string;
    ltv?: string;
    conv?: string;
    team?: string;
    channels?: string[];
    website?: string;
  };

  return `You are a top-tier Big 4 strategy partner. Analyze this business rigorously. Output ONLY raw JSON. Start with { and end with }. No markdown, no backticks, no text before or after.

COMPANY:${d.name || "N/A"} INDUSTRY:${d.industry || "N/A"} STAGE:${d.stage || "N/A"}
REVENUE/mo:$${d.revenue || "?"} COSTS/mo:$${d.costs || "?"} CAC:$${d.cac || "?"} LTV:$${d.ltv || "?"}
CONVERSION:${d.conv || "?"}% TEAM:${d.team || "?"} CHANNELS:${(d.channels || []).join(",") || "none"} WEB:${d.website || "N/A"}

Return exactly this JSON (replace all placeholder values with real data-driven analysis):
{"score":75,"summary":"One incisive sentence referencing actual numbers","metrics":{"Margin":"28%","LTV:CAC":"3.2x","Runway":"6 mo","Unit Econ":"Marginal"},"radarLabels":["Growth","Margin","Retention","Marketing","Ops"],"radarVals":[65,40,70,55,60],"channelLabels":["SEO","Paid","LinkedIn","Social","Email"],"channelVals":[75,60,45,80,55],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"problems":["Problem 1 with specific data","Problem 2","Problem 3","Problem 4"],"rootCauses":["Root cause 1","Root cause 2","Root cause 3"],"pillars":[{"title":"Pillar 1","desc":"Two specific actionable sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"One bold concluding sentence."}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.industry || !body.stage) {
      return NextResponse.json(
        { error: "Missing required fields: name, industry, stage" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: buildPrompt(body),
        },
      ],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { error: "Invalid response from AI" },
        { status: 500 }
      );
    }

    const report = JSON.parse(raw.slice(start, end + 1));

    if (typeof report.score !== "number") {
      report.score = parseInt(String(report.score)) || 50;
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Analyze API error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
