import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { analytics } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  Calendar,
  FileText,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  IndianRupee,
  CheckCircle2,
  Filter,
  Plus,
  Share2,
  Sparkles,
  ShieldCheck,
  Leaf,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Admin Dashboard" },
      { name: "description", content: "Generate and export delivery reports, financial analytics, and operational metrics." },
    ],
  }),
  component: AdminReportsPage,
});

export interface ReportItem {
  id: string;
  title: string;
  category: "Performance" | "Financials" | "Medical" | "Operations" | "Sustainability";
  format: "PDF" | "CSV" | "XLSX";
  size: string;
  generatedDate: string;
  downloads: number;
}

const PREBUILT_REPORTS: ReportItem[] = [
  {
    id: "REP-2026-08",
    title: "Monthly Logistics & Operations Overview",
    category: "Operations",
    format: "PDF",
    size: "2.4 MB",
    generatedDate: "Aug 01, 2026",
    downloads: 142,
  },
  {
    id: "REP-2026-07",
    title: "Courier Partner Earnings & Payout Log",
    category: "Financials",
    format: "CSV",
    size: "1.1 MB",
    generatedDate: "Jul 31, 2026",
    downloads: 89,
  },
  {
    id: "REP-2026-06",
    title: "Medical Priority Lane Compliance & Audit",
    category: "Medical",
    format: "PDF",
    size: "850 KB",
    generatedDate: "Jul 28, 2026",
    downloads: 64,
  },
  {
    id: "REP-2026-05",
    title: "Hub Throughput & Congestion Diagnostics",
    category: "Performance",
    format: "CSV",
    size: "3.2 MB",
    generatedDate: "Jul 20, 2026",
    downloads: 210,
  },
  {
    id: "REP-2026-04",
    title: "CO₂ Offset & Sustainability Compliance Audit",
    category: "Sustainability",
    format: "PDF",
    size: "1.4 MB",
    generatedDate: "Jul 15, 2026",
    downloads: 51,
  },
];

function AdminReportsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [reportList, setReportList] = useState<ReportItem[]>(PREBUILT_REPORTS);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // New custom report state
  const [reportTitle, setReportTitle] = useState("");
  const [reportCategory, setReportCategory] = useState<ReportItem["category"]>("Performance");
  const [reportFormat, setReportFormat] = useState<ReportItem["format"]>("PDF");

  const filteredReports = useMemo(() => {
    return reportList.filter(
      (r) => categoryFilter === "ALL" || r.category === categoryFilter
    );
  }, [reportList, categoryFilter]);

  const handleDownload = (title: string, format: string) => {
    toast.success(`Downloading ${title} (${format})...`);
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newReport: ReportItem = {
        id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
        title: reportTitle,
        category: reportCategory,
        format: reportFormat,
        size: "1.8 MB",
        generatedDate: "Just now",
        downloads: 0,
      };

      setReportList([newReport, ...reportList]);
      setIsGenerateOpen(false);
      setReportTitle("");
      toast.success(`Report "${reportTitle}" generated successfully!`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Generate, schedule, and export platform analytics, financial ledgers, and delivery metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">This Quarter</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={() => setIsGenerateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Generate Custom Report
          </Button>
        </div>
      </div>

      {/* Top Executive Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Total Deliveries <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">24,819</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +8.4% vs previous period
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            On-Time SLA Rate <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">97.4%</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +1.2% SLA compliance
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Avg Transit Time <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">4.2 hrs</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            −18 min faster route optimization
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <div className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            Gross Billing <IndianRupee className="h-4 w-4 text-foreground" />
          </div>
          <div className="text-2xl font-semibold font-display mt-2">₹42.1L</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +12% revenue growth
          </div>
        </div>
      </div>

      {/* Analytics Visualizations (Single Color Theme) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart 1: Volume Trend */}
        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Delivery Volume & SLA Performance
              </h2>
              <p className="text-xs text-muted-foreground">
                Daily booked vs successfully delivered parcels
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              7 Day Stream
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Area type="monotone" dataKey="shipments" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="delivered" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="border rounded-lg p-5 bg-card space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Package Mix & Priority Breakdown
              </h2>
              <p className="text-xs text-muted-foreground">
                Shipments categorized by service tier percentage
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-normal">
              Categorized
            </Badge>
          </div>

          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.categoryMix} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pre-Built Reports Directory Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Report Archives & Exports
            </h2>
            <p className="text-xs text-muted-foreground">
              Download pre-formatted PDF and CSV reports generated by AI Coordinator.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
                <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Financials">Financials</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
                <SelectItem value="Sustainability">Sustainability</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table of Reports */}
        <div className="border rounded-lg bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Report Title</TableHead>
                <TableHead className="text-xs font-medium">Category</TableHead>
                <TableHead className="text-xs font-medium">Format</TableHead>
                <TableHead className="text-xs font-medium">Size</TableHead>
                <TableHead className="text-xs font-medium">Generated</TableHead>
                <TableHead className="text-xs font-medium text-right">Downloads</TableHead>
                <TableHead className="w-24 text-right text-xs font-medium">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((r) => (
                <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-md bg-muted border grid place-items-center text-foreground shrink-0">
                        {r.format === "PDF" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileSpreadsheet className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground text-xs">{r.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{r.id}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[11px] border-border bg-muted/20">
                      {r.category}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {r.format}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {r.size}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {r.generatedDate}
                  </TableCell>

                  <TableCell className="text-right font-medium">
                    {r.downloads}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleDownload(r.title, r.format)}
                    >
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Generate Custom Report Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Custom Report</DialogTitle>
            <DialogDescription>
              Select report criteria and file format to compile custom analytics data.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label htmlFor="rep-title" className="text-xs">Report Title</Label>
              <Input
                id="rep-title"
                placeholder="e.g. Q3 Fleet Efficiency & Fuel Audit"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select
                  value={reportCategory}
                  onValueChange={(v) => setReportCategory(v as ReportItem["category"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Financials">Financials</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Sustainability">Sustainability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Export Format</Label>
                <Select
                  value={reportFormat}
                  onValueChange={(v) => setReportFormat(v as ReportItem["format"])}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF Document</SelectItem>
                    <SelectItem value="CSV">CSV Data File</SelectItem>
                    <SelectItem value="XLSX">Excel Spreadsheet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsGenerateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isGenerating} className="gap-1.5">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling...
                  </>
                ) : (
                  <>Generate Report</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
