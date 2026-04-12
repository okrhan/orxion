import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const mod = body.module || "strategy";

    const prompts: Record<string, string> = {
      strategy: `You are a Big 4 strategy partner. Analyze this business. Return ONLY raw JSON starting with { and ending with }. No markdown, no backticks.
COMPANY:${body.name} INDUSTRY:${body.industry} STAGE:${body.stage}
REVENUE:$${body.revenue||"?"}/mo COSTS:$${body.costs||"?"}/mo CAC:$${body.cac||"?"} LTV:$${body.ltv||"?"}
TEAM:${body.team||"?"} CHANNELS:${(body.channels||[]).join(",")||"none"} WEB:${body.website||"N/A"}
Return: {"score":75,"summary":"One incisive sentence with numbers","metrics":{"Margin":"28%","LTV:CAC":"3.2x","Runway":"6 mo","Unit Econ":"Marginal"},"radarLabels":["Growth","Margin","Retention","Marketing","Ops"],"radarVals":[65,40,70,55,60],"channelLabels":["SEO","Paid","LinkedIn","Social","Email"],"channelVals":[75,60,45,80,55],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"problems":["Problem 1 with data","Problem 2","Problem 3","Problem 4"],"rootCauses":["Root cause 1","Root cause 2","Root cause 3"],"pillars":[{"title":"Pillar 1","desc":"Two actionable sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"Bold conclusion."}`,

      valuation: `You are an investment banker. Provide investor-grade valuation. Return ONLY raw JSON starting with { and ending with }. No markdown.
COMPANY:${body.name} INDUSTRY:${body.industry} STAGE:${body.stage}
REVENUE:$${body.revenue} MARGIN:${body.margin}% GROWTH:${body.growth}% CHURN:${body.churn}%
FUNDING:$${body.funding} TEAM:${body.team} PURPOSE:${body.purpose} COMPS:${body.comps}
Return: {"score":72,"summary":"Investment readiness sentence","metrics":{"ARR":"$1.2M","Gross Margin":"65%","Growth":"40% YoY","Burn Multiple":"1.8x"},"valuation":{"revenueMultiple":"4.2x","evRange":"$4.8M–$8.5M","method":"Revenue multiple based on sector benchmarks","bull":"$8.5M","base":"$6.2M","bear":"$4.8M","enhancers":["Enhancer 1","Enhancer 2","Enhancer 3"],"investorNote":"Investment narrative sentence."},"radarLabels":["Growth","Margin","Retention","Team","Market"],"radarVals":[70,65,55,60,75],"problems":["Risk 1","Risk 2","Risk 3"],"rootCauses":["Cause 1","Cause 2"],"pillars":[{"title":"Value Pillar 1","desc":"Two sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"Investment thesis sentence."}`,

      marketing: `You are a senior digital marketing strategist. Audit this business marketing presence. Return ONLY raw JSON starting with { and ending with }. No markdown.
COMPANY:${body.name} INDUSTRY:${body.industry} TARGET:${body.target}
WEBSITE:${body.website} INSTAGRAM:${body.instagram} LINKEDIN:${body.linkedin}
FACEBOOK:${body.facebook} GOAL:${body.goal} COMPETITORS:${body.competitors}
Return: {"score":58,"summary":"Marketing effectiveness sentence","metrics":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["Issue 1","Issue 2","Issue 3","Issue 4"],"recommendations":["Recommendation 1","Recommendation 2","Recommendation 3","Recommendation 4"]},"radarLabels":["Website","SEO","Social","Messaging","Conversion"],"radarVals":[60,50,70,55,40],"problems":["Problem 1","Problem 2","Problem 3"],"rootCauses":["Cause 1","Cause 2","Cause 3"],"pillars":[{"title":"Marketing Pillar 1","desc":"Two sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["Action 1","Action 2","Action 3"],"d60":["Action 1","Action 2","Action 3"],"d90":["Action 1","Action 2","Action 3"]},"verdict":"Marketing potential conclusion."}`,

      bundle: `You are a Big 4 partner, investment banker and marketing strategist. Complete business intelligence report. Return ONLY raw JSON starting with { and ending with }. No markdown.
COMPANY:${body.name} INDUSTRY:${body.industry} STAGE:${body.stage}
REVENUE:$${body.revenue} MARGIN:${body.margin}% GROWTH:${body.growth}% CHURN:${body.churn}%
TEAM:${body.team} WEBSITE:${body.website} INSTAGRAM:${body.instagram} LINKEDIN:${body.linkedin}
PURPOSE:${body.purpose}
Return: {"score":68,"summary":"Comprehensive one-sentence summary","metrics":{"Revenue":"$XM","Margin":"X%","Valuation":"$XM","Mktg Score":"X/10"},"valuation":{"revenueMultiple":"4.2x","evRange":"$4.8M–$8.5M","method":"Sector revenue multiple","bull":"$8.5M","base":"$6.2M","bear":"$4.8M","enhancers":["E1","E2","E3"],"investorNote":"Investment note."},"marketing":{"websiteScore":"6/10","scores":{"Website":"6/10","SEO":"5/10","Social":"7/10","Conversion":"4/10"},"issues":["I1","I2","I3"],"recommendations":["R1","R2","R3"]},"radarLabels":["Strategy","Finance","Marketing","Operations","Growth"],"radarVals":[70,65,55,60,75],"revenueHistory":[42,45,48,44,52,58,56,62,60,68,72,74],"channelLabels":["Website","SEO","Social","Email","Paid"],"channelVals":[60,50,70,45,55],"problems":["P1","P2","P3","P4"],"rootCauses":["C1","C2","C3"],"pillars":[{"title":"Pillar 1","desc":"Two sentences."},{"title":"Pillar 2","desc":"Two sentences."},{"title":"Pillar 3","desc":"Two sentences."}],"plan":{"d30":["A1","A2","A3"],"d60":["A1","A2","A3"],"d90":["A1","A2","A3"]},"verdict":"Unified conclusion."}`
    };

    const prompt = prompts[mod] || prompts.strategy;

    // Use fetch directly — no SDK, no extra dependencies
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Anthropic error ${res.status}: ${errText.slice(0, 150)}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const raw = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .trim();

    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s === -1 || e === -1) {
      return NextResponse.json({ error: "No JSON in AI response" }, { status: 500 });
    }

    const report = JSON.parse(raw.slice(s, e + 1));
    if (typeof report.score !== "number") report.score = 50;

    return NextResponse.json({ report });

  } catch (err) {
    console.error("route error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
