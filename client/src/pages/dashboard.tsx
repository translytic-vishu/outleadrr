import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Lead, LeadsResponse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Mail,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Globe,
  Phone,
  Building2,
  MapPin,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

const EXAMPLE_SEARCHES = [
  { business: "plumbers", location: "Houston, TX" },
  { business: "dentists", location: "Los Angeles, CA" },
  { business: "HVAC companies", location: "Chicago, IL" },
  { business: "law firms", location: "New York, NY" },
  { business: "real estate agents", location: "Miami, FL" },
];

function GlowOrb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  );
}

function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute left-0 right-0 h-px opacity-10"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.8), rgba(168,85,247,0.8), transparent)",
          animation: "scan-line 8s linear infinite",
        }}
      />
    </div>
  );
}

function GridPattern() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string | number;
  delay?: number;
}) {
  return (
    <div
      className="relative rounded-md p-4 flex items-center gap-3"
      style={{
        background: "rgba(15,15,20,0.8)",
        border: "1px solid rgba(99,102,241,0.15)",
        animation: `fade-up 0.5s ease-out ${delay}ms forwards`,
        opacity: 0,
      }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.15)" }}
      >
        <Icon className="w-4 h-4 text-indigo-400" />
      </div>
      <div>
        <p className="text-xs text-white/40 font-display uppercase tracking-widest leading-none mb-1">
          {label}
        </p>
        <p className="text-lg font-display font-semibold text-white leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmailCard({ lead, index }: { lead: Lead; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<"subject" | "body" | "email" | null>(null);
  const { toast } = useToast();

  const copyText = async (text: string, type: "subject" | "body" | "email") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusColors: Record<string, string> = {
    new: "rgba(99,102,241,0.2)",
    contacted: "rgba(234,179,8,0.2)",
    replied: "rgba(34,197,94,0.2)",
    closed: "rgba(107,114,128,0.2)",
  };

  const statusTextColors: Record<string, string> = {
    new: "#818cf8",
    contacted: "#fbbf24",
    replied: "#4ade80",
    closed: "#9ca3af",
  };

  return (
    <div
      className="relative rounded-md group"
      style={{
        background: "rgba(10,10,15,0.9)",
        border: "1px solid rgba(99,102,241,0.12)",
        animation: `fade-up 0.5s ease-out ${index * 60}ms forwards`,
        opacity: 0,
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.35)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 30px rgba(99,102,241,0.08), 0 0 60px rgba(168,85,247,0.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99,102,241,0.12)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-md flex-shrink-0 font-display font-bold text-sm"
              style={{
                background: `linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))`,
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#a5b4fc",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-white text-base leading-tight truncate">
                {lead.companyName}
              </h3>
              <p className="text-sm text-white/50 mt-0.5">{lead.contactName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <span
              className="text-xs font-display font-medium px-2 py-1 rounded-md uppercase tracking-wider"
              style={{
                background: statusColors[lead.status || "new"],
                color: statusTextColors[lead.status || "new"],
              }}
            >
              {lead.status || "new"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => copyText(lead.email, "email")}
            className="flex items-center gap-2 text-sm text-white/60 rounded-md px-3 py-2 text-left transition-colors duration-200"
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.1)",
            }}
            data-testid={`button-copy-email-${lead.id}`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate font-mono text-xs">{lead.email}</span>
            {copied === "email" ? (
              <CheckCheck className="w-3.5 h-3.5 text-green-400 ml-auto flex-shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/30 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {lead.phone && (
            <div
              className="flex items-center gap-2 text-sm text-white/60 rounded-md px-3 py-2"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-mono">{lead.phone}</span>
            </div>
          )}

          {lead.website && (
            <div
              className="flex items-center gap-2 text-sm text-white/60 rounded-md px-3 py-2"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.1)",
              }}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-xs font-mono truncate">{lead.website}</span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-md transition-all duration-200 text-left"
            style={{
              background: expanded ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.05)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}
            data-testid={`button-expand-email-${lead.id}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <span className="text-xs font-display font-medium text-white/70 uppercase tracking-wider">
                AI Cold Email
              </span>
              <span className="text-xs text-white/40 truncate hidden sm:block">
                — {lead.emailSubject}
              </span>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
            )}
          </button>

          {expanded && (
            <div
              className="mt-2 rounded-md overflow-hidden"
              style={{
                border: "1px solid rgba(99,102,241,0.12)",
                animation: "fade-in 0.3s ease-out forwards",
              }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between gap-2"
                style={{ background: "rgba(99,102,241,0.08)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}
              >
                <div className="min-w-0">
                  <p className="text-xs text-white/40 font-display uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-sm font-display font-medium text-white truncate">{lead.emailSubject}</p>
                </div>
                <button
                  onClick={() => copyText(lead.emailSubject, "subject")}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors duration-200 flex-shrink-0"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    color: copied === "subject" ? "#4ade80" : "#a5b4fc",
                  }}
                  data-testid={`button-copy-subject-${lead.id}`}
                >
                  {copied === "subject" ? (
                    <><CheckCheck className="w-3 h-3" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              </div>

              <div className="px-4 py-4" style={{ background: "rgba(5,5,10,0.8)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-xs text-white/40 font-display uppercase tracking-wider">Email Body</p>
                  <button
                    onClick={() => copyText(lead.emailBody, "body")}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors duration-200 flex-shrink-0"
                    style={{
                      background: "rgba(99,102,241,0.15)",
                      color: copied === "body" ? "#4ade80" : "#a5b4fc",
                    }}
                    data-testid={`button-copy-body-${lead.id}`}
                  >
                    {copied === "body" ? (
                      <><CheckCheck className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </button>
                </div>
                <div className="text-sm text-white/70 leading-relaxed whitespace-pre-line font-sans">
                  {lead.emailBody}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  const steps = [
    "Scanning business directory...",
    "Identifying top prospects...",
    "Analyzing company profiles...",
    "Crafting personalized emails...",
    "Finalizing lead intelligence...",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      <div className="relative">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(10,10,20,0.8)",
            boxShadow: "0 0 40px rgba(99,102,241,0.2), inset 0 0 20px rgba(99,102,241,0.05)",
          }}
        >
          <Zap className="w-7 h-7 text-indigo-400" style={{ animation: "float 2s ease-in-out infinite" }} />
        </div>
        <div
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            border: "1px solid rgba(168,85,247,0.5)",
            animation: "glow-pulse 2s ease-in-out infinite",
            transform: "scale(1.3)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            border: "1px solid rgba(99,102,241,0.5)",
            animation: "glow-pulse 2s ease-in-out infinite 0.5s",
            transform: "scale(1.6)",
          }}
        />
      </div>

      <div className="text-center">
        <p
          key={step}
          className="font-display text-white/70 text-sm tracking-widest uppercase"
          style={{ animation: "fade-up 0.4s ease-out forwards" }}
        >
          {steps[step]}
        </p>
      </div>

      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i <= step ? "rgba(99,102,241,0.8)" : "rgba(99,102,241,0.2)",
              boxShadow: i <= step ? "0 0 6px rgba(99,102,241,0.6)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<LeadsResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (data: { businessType: string; location: string }) => {
      const res = await apiRequest("POST", "/api/generate-leads", data);
      return res.json() as Promise<LeadsResponse>;
    },
    onSuccess: (data) => {
      setResult(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    },
    onError: (err: any) => {
      toast({
        title: "Generation Failed",
        description: err.message || "Could not generate leads. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType.trim() || !location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both a business type and location.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ businessType: businessType.trim(), location: location.trim() });
  };

  const handleExample = (example: (typeof EXAMPLE_SEARCHES)[0]) => {
    setBusinessType(example.business);
    setLocation(example.location);
  };

  const copyAllEmails = async () => {
    if (!result) return;
    const emails = result.leads.map((l) => l.email).join(", ");
    await navigator.clipboard.writeText(emails);
    toast({ title: "Copied!", description: "All 10 email addresses copied to clipboard." });
  };

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: "#000000", color: "#ffffff" }}
    >
      <GridPattern />
      <ScanLine />

      <GlowOrb className="w-[600px] h-[600px] top-[-200px] left-[-200px] opacity-30" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)" }} />
      <GlowOrb className="w-[400px] h-[400px] top-[-100px] right-[-100px] opacity-20" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32">
        {/* Header */}
        <header className="text-center mb-20">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)",
              animation: "fade-in 0.6s ease-out forwards",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              style={{ animation: "glow-pulse 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(99,102,241,0.8)" }}
            />
            <span className="text-xs font-display font-medium text-indigo-300 uppercase tracking-widest">
              AI Sales Intelligence
            </span>
          </div>

          <h1
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight mb-6"
            style={{ animation: "fade-up 0.6s ease-out 0.1s forwards", opacity: 0 }}
          >
            <span className="text-white">Find Your Next</span>
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              10 Clients
            </span>
          </h1>

          <p
            className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed font-sans"
            style={{ animation: "fade-up 0.6s ease-out 0.2s forwards", opacity: 0 }}
          >
            Enter a business type and city. Our AI finds 10 real prospects
            and writes a personalized cold email for each one — instantly.
          </p>
        </header>

        {/* Search Form */}
        <div
          className="relative rounded-lg p-8 mb-8"
          style={{
            background: "rgba(10,10,15,0.9)",
            border: "1px solid rgba(99,102,241,0.2)",
            boxShadow: "0 0 60px rgba(99,102,241,0.06), 0 0 120px rgba(168,85,247,0.03)",
            animation: "fade-up 0.6s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          <div
            className="absolute inset-0 rounded-lg opacity-50 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.08) 0%, transparent 60%)",
            }}
          />

          <form onSubmit={handleSubmit} className="relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-display font-medium text-white/40 uppercase tracking-widest mb-2">
                  Business Type
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                  <Input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. plumbers, dentists, HVAC..."
                    className="pl-9 font-sans text-white placeholder-white/20 border-white/10 focus:border-indigo-500/50 bg-white/5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(99,102,241,0.15)",
                    }}
                    data-testid="input-business-type"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-medium text-white/40 uppercase tracking-widest mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400/60" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Houston, TX or Chicago..."
                    className="pl-9 font-sans text-white placeholder-white/20 border-white/10 focus:border-indigo-500/50 bg-white/5"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(99,102,241,0.15)",
                    }}
                    data-testid="input-location"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full font-display font-semibold text-sm uppercase tracking-widest h-11"
              style={{
                background: mutation.isPending
                  ? "rgba(99,102,241,0.3)"
                  : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: mutation.isPending ? "none" : "0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(168,85,247,0.1)",
                transition: "all 0.3s ease",
              }}
              data-testid="button-generate-leads"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ animation: "spin-slow 2s linear infinite" }} />
                  Generating Intelligence...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Generate 10 Leads + Emails
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs text-white/30 font-display uppercase tracking-widest mb-3">
              Quick Start
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_SEARCHES.map((ex) => (
                <button
                  key={ex.business}
                  onClick={() => handleExample(ex)}
                  className="text-xs px-3 py-1.5 rounded-md font-sans transition-all duration-200"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                    color: "rgba(165,180,252,0.8)",
                  }}
                  data-testid={`button-example-${ex.business.replace(/\s+/g, "-")}`}
                >
                  {ex.business} in {ex.location}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {mutation.isPending && <LoadingState />}

        {/* Results */}
        {result && !mutation.isPending && (
          <div ref={resultsRef}>
            {/* Stats Row */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
              style={{ animation: "fade-up 0.5s ease-out forwards" }}
            >
              <StatCard icon={Users} label="Leads Found" value={result.leads.length} delay={0} />
              <StatCard icon={Mail} label="Emails Written" value={result.leads.length} delay={60} />
              <StatCard icon={Target} label="Business Type" value={result.businessType} delay={120} />
              <StatCard icon={MapPin} label="Location" value={result.location} delay={180} />
            </div>

            {/* Results Header */}
            <div
              className="flex items-center justify-between gap-4 mb-6 flex-wrap"
              style={{ animation: "fade-up 0.5s ease-out 0.1s forwards", opacity: 0 }}
            >
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  Lead Intelligence Report
                </h2>
                <p className="text-sm text-white/40 mt-0.5 font-sans">
                  {result.leads.length} prospects found for{" "}
                  <span className="text-indigo-400">{result.businessType}</span> in{" "}
                  <span className="text-purple-400">{result.location}</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={copyAllEmails}
                className="font-display text-xs uppercase tracking-widest flex items-center gap-2"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  borderColor: "rgba(99,102,241,0.2)",
                  color: "#a5b4fc",
                }}
                data-testid="button-copy-all-emails"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy All Emails
              </Button>
            </div>

            {/* Lead Cards Grid */}
            <div className="flex flex-col gap-4">
              {result.leads.map((lead, i) => (
                <EmailCard key={lead.id} lead={lead} index={i} />
              ))}
            </div>

            {/* Footer CTA */}
            <div
              className="mt-12 text-center"
              style={{ animation: "fade-up 0.5s ease-out 0.8s forwards", opacity: 0 }}
            >
              <p className="text-white/30 text-sm font-sans mb-4">
                Ready to reach out? Click on any email to copy it.
              </p>
              <Button
                onClick={() => mutation.mutate({ businessType, location })}
                variant="outline"
                className="font-display text-xs uppercase tracking-widest"
                style={{
                  background: "transparent",
                  borderColor: "rgba(99,102,241,0.2)",
                  color: "rgba(165,180,252,0.7)",
                }}
                data-testid="button-regenerate"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Generate New Batch
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !mutation.isPending && (
          <div className="mt-12">
            <div
              className="text-center py-16 rounded-lg relative overflow-hidden"
              style={{
                background: "rgba(5,5,10,0.5)",
                border: "1px solid rgba(99,102,241,0.08)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)",
                }}
              />
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.15)",
                  }}
                >
                  <TrendingUp className="w-6 h-6 text-indigo-400/60" />
                </div>
                <h3 className="font-display font-semibold text-white/50 text-lg mb-2">
                  No leads generated yet
                </h3>
                <p className="text-white/25 text-sm font-sans max-w-xs mx-auto">
                  Enter a business type and location above to discover your next 10 clients with personalized outreach.
                </p>

                <div className="mt-8 grid grid-cols-3 gap-4 max-w-xs mx-auto">
                  {[
                    { icon: Search, label: "Find" },
                    { icon: Sparkles, label: "Write" },
                    { icon: Mail, label: "Send" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}
                      >
                        <Icon className="w-4 h-4 text-indigo-400/50" />
                      </div>
                      <span className="text-xs text-white/30 font-display uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
