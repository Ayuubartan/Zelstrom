import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useZelstromStore } from "@/store/zelstromStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileImage, FileText, FileSpreadsheet, Trash2, X,
  Loader2, Eye, Brain, ChevronDown, ChevronUp, Download,
  Image, BarChart3, Workflow, Factory,
} from "lucide-react";
import { toast } from "sonner";

interface DesignUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number;
  mime_type: string | null;
  category: string;
  description: string;
  tags: string[];
  analysis_result: any;
  analysis_status: string;
  extracted_data: any;
  created_at: string;
}

const CATEGORIES = [
  { value: "product_design", label: "Product Design", icon: Image },
  { value: "process_flow", label: "Process Flow", icon: Workflow },
  { value: "report", label: "Report / Data", icon: FileSpreadsheet },
];

const FILE_ICON: Record<string, React.ElementType> = {
  image: FileImage,
  pdf: FileText,
  spreadsheet: FileSpreadsheet,
  document: FileText,
};

export function DesignUploadPanel() {
  const [uploads, setUploads] = useState<DesignUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("product_design");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);

  const initializeScenario = useZelstromStore(s => s.initializeScenario);
  const factorySettings = useZelstromStore(s => s.factorySettings);
  const setFactorySettings = useZelstromStore(s => s.setFactorySettings);

  const loadUploads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("design_uploads")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUploads(data as unknown as DesignUpload[]);
    if (error) toast.error("Failed to load designs");
    setLoading(false);
    setLoaded(true);
  }, []);

  useEffect(() => { if (!loaded) loadUploads(); }, [loaded, loadUploads]);

  const getFileType = (mime: string): string => {
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "pdf";
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return "spreadsheet";
    return "document";
  };

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("designs")
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Upload failed: ${file.name}`);
        continue;
      }

      const { data: publicUrl } = supabase.storage.from("designs").getPublicUrl(filePath);

      const fileType = getFileType(file.type);
      const { data, error } = await supabase.from("design_uploads").insert({
        file_name: file.name,
        file_type: fileType,
        file_url: publicUrl.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        category: selectedCategory,
        description: "",
        tags: [],
        analysis_status: "pending",
      }).select().single();

      if (data) {
        setUploads(prev => [data as unknown as DesignUpload, ...prev]);
        toast.success(`Uploaded: ${file.name}`);
      }
      if (error) toast.error(`Save failed: ${file.name}`);
    }
    setUploading(false);
  }, [selectedCategory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const handleAnalyze = useCallback(async (upload: DesignUpload) => {
    setAnalyzing(upload.id);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-design", {
        body: {
          designId: upload.id,
          fileUrl: upload.file_url,
          fileName: upload.file_name,
          fileType: upload.file_type,
          category: upload.category,
        },
      });

      if (error) throw error;

      setUploads(prev => prev.map(u =>
        u.id === upload.id
          ? { ...u, analysis_result: data.analysis, extracted_data: data.extractedData, analysis_status: "completed" }
          : u
      ));
      toast.success(`Analysis complete: ${upload.file_name}`);
    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, analysis_status: "failed" } : u));
    }
    setAnalyzing(null);
  }, []);

  const handleDelete = useCallback(async (upload: DesignUpload) => {
    const urlParts = upload.file_url.split("/designs/");
    const filePath = urlParts[urlParts.length - 1];
    await supabase.storage.from("designs").remove([filePath]);
    await supabase.from("design_uploads").delete().eq("id", upload.id);
    setUploads(prev => prev.filter(u => u.id !== upload.id));
    toast.success("Deleted");
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-foreground">Designs & Reports</span>
        <Badge variant="secondary" className="text-[8px] font-mono h-4 px-1.5 ml-auto">
          {uploads.length} files
        </Badge>
      </div>

      {/* Category selector */}
      <div className="px-4 py-2 flex gap-1.5 border-b border-border/30">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-mono transition-colors ${
              selectedCategory === cat.value
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary/50 text-muted-foreground border border-transparent hover:border-border"
            }`}
          >
            <cat.icon className="w-3 h-3" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mx-4 mt-3 mb-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          dragOver
            ? "border-primary/50 bg-primary/5"
            : "border-border/50 hover:border-primary/30 hover:bg-secondary/30"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-muted-foreground" />
        )}
        <p className="text-[10px] font-mono text-muted-foreground">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </p>
        <p className="text-[8px] font-mono text-muted-foreground/50">
          Images, PDFs, Spreadsheets, Diagrams
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
          onChange={e => handleUpload(e.target.files)}
          className="hidden"
        />
      </div>

      {/* File list */}
      <div className="px-4 pb-3 space-y-2 max-h-[400px] overflow-y-auto">
        {loading && <p className="text-[10px] font-mono text-muted-foreground text-center py-4">Loading...</p>}
        {!loading && uploads.length === 0 && (
          <p className="text-[10px] font-mono text-muted-foreground text-center py-4">No designs uploaded yet</p>
        )}
        {uploads.map(upload => {
          const Icon = FILE_ICON[upload.file_type] || FileText;
          const isExpanded = expanded === upload.id;
          const isAnalyzing = analyzing === upload.id;
          const isImage = upload.file_type === "image";

          return (
            <div key={upload.id} className="bg-secondary/50 rounded-md overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 p-2.5">
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-foreground truncate">{upload.file_name}</p>
                  <p className="text-[8px] font-mono text-muted-foreground">
                    {formatSize(upload.file_size)} · {CATEGORIES.find(c => c.value === upload.category)?.label || upload.category}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[7px] font-mono h-3.5 px-1 shrink-0 ${
                    upload.analysis_status === "completed" ? "bg-emerald-500/10 text-emerald-400" :
                    upload.analysis_status === "failed" ? "bg-destructive/10 text-destructive" :
                    "text-muted-foreground"
                  }`}
                >
                  {upload.analysis_status}
                </Badge>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleAnalyze(upload)}
                    disabled={isAnalyzing}
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    title="Analyze with AI"
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : upload.id)}
                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(upload)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Expanded view */}
              {isExpanded && (
                <div className="px-2.5 pb-2.5 space-y-2 border-t border-border/30 pt-2">
                  {/* Preview */}
                  {isImage && (
                    <div className="rounded-md overflow-hidden border border-border/30">
                      <img src={upload.file_url} alt={upload.file_name} className="w-full h-40 object-contain bg-background" />
                    </div>
                  )}
                  {!isImage && (
                    <a href={upload.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[9px] font-mono text-primary hover:underline">
                      <Eye className="w-3 h-3" /> View File
                    </a>
                  )}

                  {/* Analysis results */}
                  {upload.analysis_result && (
                    <div className="bg-card/50 rounded p-2 space-y-1.5">
                      <p className="text-[8px] font-mono text-primary uppercase tracking-wider flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> AI Analysis
                      </p>
                      {upload.analysis_result.summary && (
                        <p className="text-[9px] font-mono text-foreground">{upload.analysis_result.summary}</p>
                      )}
                      {upload.analysis_result.scores && (
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(upload.analysis_result.scores).map(([key, val]) => (
                            <div key={key} className="bg-secondary/50 rounded px-2 py-1 text-center">
                              <p className="text-[8px] font-mono text-muted-foreground uppercase">{key}</p>
                              <p className="text-[11px] font-mono font-bold text-foreground">{String(val)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {upload.analysis_result.suggestions && (
                        <div>
                          <p className="text-[8px] font-mono text-muted-foreground uppercase mb-1">Suggestions</p>
                          {(upload.analysis_result.suggestions as string[]).map((s, i) => (
                            <p key={i} className="text-[9px] font-mono text-muted-foreground">
                              <span className="text-primary mr-1">{i + 1}.</span> {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted data */}
                  {upload.extracted_data && (
                    <div className="bg-card/50 rounded p-2 space-y-1">
                      <p className="text-[8px] font-mono text-primary uppercase tracking-wider flex items-center gap-1">
                        <Download className="w-3 h-3" /> Extracted Data
                      </p>
                      <pre className="text-[8px] font-mono text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(upload.extracted_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
