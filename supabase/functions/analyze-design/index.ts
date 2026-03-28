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

    // Build analysis based on file type and category
    const analysis = generateAnalysis(fileName, fileType, category);
    const extractedData = generateExtractedData(fileType, category);

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
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function generateAnalysis(fileName: string, fileType: string, category: string) {
  const r = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

  const baseScores: Record<string, Record<string, number>> = {
    product_design: {
      feasibility: r(60, 95),
      costEfficiency: r(50, 90),
      qualityPotential: r(65, 98),
      manufacturability: r(55, 92),
      innovation: r(40, 85),
    },
    process_flow: {
      efficiency: r(50, 95),
      bottleneckRisk: r(10, 60),
      throughput: r(55, 90),
      complexity: r(20, 80),
      scalability: r(45, 92),
    },
    report: {
      dataQuality: r(60, 98),
      completeness: r(50, 95),
      actionability: r(45, 88),
      accuracy: r(65, 97),
      relevance: r(55, 90),
    },
  };

  const scores = baseScores[category] || baseScores.product_design;

  const suggestionPools: Record<string, string[]> = {
    product_design: [
      "Consider reducing part complexity to improve CNC machinability",
      "Material substitution could reduce cost by ~15% without sacrificing strength",
      "Add tolerance callouts for critical mating surfaces",
      "The wall thickness ratio may cause warping during cooling — increase by 0.5mm",
      "Explore additive manufacturing for prototype iterations",
      "Assembly sequence could be optimized — reduce from 12 to 8 steps",
    ],
    process_flow: [
      "Station 3 appears to be a bottleneck — consider parallel processing",
      "Add quality gate between welding and assembly stages",
      "Reduce WIP buffer between stations 2-3 to decrease cycle time",
      "Consider automated material handling for the transport phase",
      "The inspection loop could be moved earlier to catch defects sooner",
      "Shift scheduling doesn't align with peak demand — rebalance shifts",
    ],
    report: [
      "Defect rate trend shows seasonal pattern — adjust quality checks accordingly",
      "Cost per unit increasing faster than throughput — investigate root cause",
      "Energy consumption spikes correlate with night shift operations",
      "Maintenance intervals could be extended based on sensor data trends",
      "Top 3 defect categories account for 80% of rework costs",
      "Yield improvement of 3% achievable by adjusting temperature parameters",
    ],
  };

  const pool = suggestionPools[category] || suggestionPools.product_design;
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const suggestions = shuffled.slice(0, 3 + Math.floor(Math.random() * 2));

  const overallScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
  );

  const summaries: Record<string, string> = {
    product_design: `Design "${fileName}" analyzed. Overall score: ${overallScore}/100. The design shows ${overallScore > 75 ? "strong" : "moderate"} manufacturing potential with ${overallScore > 80 ? "excellent" : "some areas for improvement in"} cost efficiency.`,
    process_flow: `Process flow "${fileName}" evaluated. Efficiency score: ${overallScore}/100. ${overallScore > 70 ? "Well-structured flow with minor optimization opportunities" : "Several bottlenecks identified that could improve throughput by 15-25%"}.`,
    report: `Report "${fileName}" parsed. Data quality: ${overallScore}/100. ${overallScore > 75 ? "High-quality data suitable for AI team simulation input" : "Some data gaps detected — manual review recommended before simulation"}.`,
  };

  return {
    summary: summaries[category] || summaries.product_design,
    overallScore,
    scores,
    suggestions,
    analyzedAt: new Date().toISOString(),
    category,
  };
}

function generateExtractedData(fileType: string, category: string) {
  if (category === "report") {
    return {
      metrics: {
        totalUnitsProduced: Math.floor(Math.random() * 5000 + 1000),
        avgCycleTime: Math.round((Math.random() * 15 + 5) * 10) / 10,
        defectRate: Math.round(Math.random() * 5 * 100) / 100,
        oee: Math.round((Math.random() * 30 + 65) * 10) / 10,
        energyConsumption: Math.round(Math.random() * 500 + 200),
      },
      parameters: {
        temperature: { min: 18, max: 35, avg: 24.5 },
        pressure: { min: 4, max: 12, avg: 8.2 },
        humidity: { min: 30, max: 65, avg: 48 },
      },
      trends: ["increasing_throughput", "stable_defect_rate", "rising_energy_cost"],
    };
  }

  if (category === "process_flow") {
    return {
      stations: Math.floor(Math.random() * 6 + 3),
      connections: Math.floor(Math.random() * 10 + 5),
      parallelPaths: Math.floor(Math.random() * 3 + 1),
      estimatedCycleTime: Math.round((Math.random() * 20 + 10) * 10) / 10,
      bottlenecks: ["Station 3 (Welding)", "Quality Gate 2"],
    };
  }

  return {
    dimensions: {
      width: Math.round(Math.random() * 200 + 50),
      height: Math.round(Math.random() * 200 + 50),
      depth: Math.round(Math.random() * 100 + 10),
    },
    materialType: ["Steel", "Aluminum", "Composite", "ABS Plastic"][Math.floor(Math.random() * 4)],
    estimatedWeight: Math.round((Math.random() * 10 + 0.5) * 10) / 10,
    partCount: Math.floor(Math.random() * 20 + 3),
    toleranceClass: ["IT6", "IT7", "IT8", "IT9"][Math.floor(Math.random() * 4)],
  };
}
