import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { designId, fileUrl, fileName, fileType, category } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the prompt based on category
    const categoryPrompts: Record<string, string> = {
      product_design: `You are a manufacturing engineer analyzing a product design file named "${fileName}".
Analyze this design for: manufacturability, cost efficiency, quality potential, feasibility, and innovation.
Consider CNC machining, welding, laser cutting, and assembly requirements.
Extract dimensions, material type, estimated weight, part count, and tolerance class if visible.`,

      process_flow: `You are a process optimization engineer analyzing a process flow diagram named "${fileName}".
Evaluate: efficiency, bottleneck risk, throughput potential, complexity, and scalability.
Extract: number of stations, connections, parallel paths, estimated cycle time, and identify bottlenecks.`,

      report: `You are a data analyst reviewing a factory report/spreadsheet named "${fileName}".
Assess: data quality, completeness, actionability, accuracy, and relevance to factory optimization.
Extract key metrics: units produced, avg cycle time, defect rate, OEE, energy consumption if available.`,
    };

    const systemPrompt = categoryPrompts[category] || categoryPrompts.product_design;

    // Build messages - for images, include the image URL
    const messages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    if (fileType === "image") {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Analyze this design image. File: ${fileName}, Category: ${category}` },
          { type: "image_url", image_url: { url: fileUrl } },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: `Analyze this ${fileType} file: "${fileName}" (Category: ${category}). The file is hosted at: ${fileUrl}. Based on the file name and category, provide your expert analysis. If this is a PDF or spreadsheet, infer likely contents from the filename and provide relevant manufacturing analysis.`,
      });
    }

    // Use tool calling for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "design_analysis",
          description: "Return structured analysis of a design file",
          parameters: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "2-3 sentence summary of the analysis findings",
              },
              overallScore: {
                type: "number",
                description: "Overall score from 0-100",
              },
              scores: {
                type: "object",
                description: "Category-specific scores (0-100). For product_design: feasibility, costEfficiency, qualityPotential, manufacturability, innovation. For process_flow: efficiency, bottleneckRisk, throughput, complexity, scalability. For report: dataQuality, completeness, actionability, accuracy, relevance.",
                additionalProperties: { type: "number" },
              },
              suggestions: {
                type: "array",
                items: { type: "string" },
                description: "3-5 actionable improvement suggestions",
              },
              extractedData: {
                type: "object",
                description: "Extracted specs/data from the design. For product_design: dimensions (width/height/depth in mm), materialType, estimatedWeight (kg), partCount, toleranceClass. For process_flow: stations count, connections, parallelPaths, estimatedCycleTime, bottlenecks array. For report: metrics object with totalUnitsProduced, avgCycleTime, defectRate, oee, energyConsumption.",
                additionalProperties: true,
              },
            },
            required: ["summary", "overallScore", "scores", "suggestions", "extractedData"],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "design_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted — please add funds in Settings" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract tool call result
    let analysis: any;
    let extractedData: any;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      analysis = {
        summary: parsed.summary,
        overallScore: parsed.overallScore,
        scores: parsed.scores,
        suggestions: parsed.suggestions,
        analyzedAt: new Date().toISOString(),
        category,
        aiModel: "gemini-2.5-flash",
      };
      extractedData = parsed.extractedData;
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      analysis = {
        summary: content.slice(0, 300),
        overallScore: 70,
        scores: {},
        suggestions: ["AI analysis completed — review the summary for details"],
        analyzedAt: new Date().toISOString(),
        category,
        aiModel: "gemini-2.5-flash",
      };
      extractedData = {};
    }

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase
      .from("design_uploads")
      .update({
        analysis_result: analysis,
        extracted_data: extractedData,
        analysis_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", designId);

    return new Response(
      JSON.stringify({ analysis, extractedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("analyze-design error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
