// pages/Dashboard.jsx (Enhanced, overflow-safe, JS only)
import * as React from "react";
import { Header } from "@/components/Header";
import api from "@/lib/api";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  MapPinned,
  Compass,
  Plane,
  MessageSquare,
  Megaphone,
  Tags,
  Users,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
} from "recharts";
import { useTheme } from "@/hooks/use-theme";
import CountCard from "@/components/dashboard/CountCard";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCurrentUser } from "@/hooks/use-currentuser";

// --- Config: add/remove models here ---
const MODEL_CARDS = [
  {
    key: "blog",
    label: "Blogs",
    icon: FileText,
    endpoint: "/api/count/blog",
  },
  {
    key: "destinations",
    label: "Destinations",
    icon: MapPinned,
    endpoint: "/api/count/destination",
  },

  {
    key: "tour",
    label: "Tours",
    icon: Plane,
    endpoint: "/api/count/tour",
  },
  {
    key: "testimonial",
    label: "Testimonials",
    icon: MessageSquare,
    endpoint: "/api/count/testimonial",
  },

  {
    key: "categories",
    label: "Categories",
    icon: Tags,
    endpoint: "/api/count/category",
  },
  { key: "users", label: "Users", icon: Users, endpoint: "/api/count/user" },
];

async function fetchCount(endpoint, filters = {}) {
  try {
    // Pass the filters, which include status, tourCreatedBy, etc.
    const { data } = await api().get(endpoint, {
      params: filters, // send optional filters like status, q, from, to, ids
    });

    // Since /api/count/:model returns { count: number } or { modelName: number }
    if (typeof data?.count === "number") return data.count;

    if (typeof data === "object") {
      // for all-models response
      const firstValue = Object.values(data)[0];
      return typeof firstValue === "number" ? firstValue : 0;
    }

    return 0;
  } catch (e) {
    toast.error("Failed to fetch count");
    console.error(
      "Count fetch failed for",
      endpoint,
      e?.response?.data || e.message
    );
    return 0;
  }
}

async function fetchLeads(limit = 6, isCreator = false) {
  try {
    const endpoint = isCreator
      ? "/api/enquiries/moderation" // Fetch enquiries for creators
      : "/api/lead/moderation"; // Fetch leads for others

    const { data } = await api().get(endpoint, {
      params: { page: 1, limit },
    });

    // Handle data based on the endpoint (either enquiries or leads)
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.items)) return data.data.items;

    // Return an empty array if no matching data is found
    return [];
  } catch (e) {
    // toast.error("Failed to fetch leads/enquiries");
    console.error("Fetch failed", e?.response?.data || e.message);
    return [];
  }
}

const useDashboardData = () => {
  const [counts, setCounts] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [leads, setLeads] = React.useState([]); // This can represent either leads or enquiries
  const [refreshKey, setRefreshKey] = React.useState(0);

  const { data: currentuser } = useCurrentUser(); // Fetch the current user inside the hook
  const isCreator = currentuser?.roleName === "creator"; // Check if the user is a creator

  const filteredModelCards = React.useMemo(() => {
    return isCreator
      ? [
          {
            key: "blog",
            label: "Blogs",
            icon: FileText,
            endpoint: "/api/count/blog",
            visible: true,
          },
          {
            key: "tour",
            label: "Tours",
            icon: Plane,
            endpoint: "/api/count/tour",
            visible: true,
          },
          {
            key: "testimonial",
            label: "Testimonials",
            icon: MessageSquare,
            endpoint: "/api/count/testimonial",
            visible: true,
          },
          {
            key: "enquiries", // added
            label: "Enquiries",
            icon: Users, // assuming same icon as for users
            endpoint: "/api/count/enquire", // assuming endpoint
            visible: true,
          },
        ]
      : MODEL_CARDS; // default for other roles
  }, [currentuser]); // Ensure it reacts to user change

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Fetch counts for the filtered model cards
      const results = await Promise.all(
        filteredModelCards.map(async (m) => {
          // Add the 'createdBy' filter only if isCreator is true
          let filter =
            isCreator && m.key !== `enquiries`
              ? { createdBy: currentuser._id }
              : {};

          if ((m.key === `enquiries` || m.key == `testimonial`) && isCreator) {
            filter = { tourCreatedBy: currentuser._id };
          }
          const count = await fetchCount(m.endpoint, filter);

          return {
            key: m.key,
            count,
          };
        })
      );

      const map = results.reduce(
        (acc, cur) => ((acc[cur.key] = cur.count || 0), acc),
        {}
      );

      // Fetch either leads or enquiries based on the user's role (isCreator)
      const leadList = await fetchLeads(6, isCreator);
      if (!alive) return;

      setCounts(map);
      setLeads(leadList); // This will hold either leads or enquiries
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [filteredModelCards, refreshKey, currentuser]); // Include filteredModelCards and currentuser in dependencies

  const totalItems = React.useMemo(() => {
    return Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  }, [counts]);

  const chartData = React.useMemo(() => {
    return filteredModelCards.map((m) => ({
      name: m.label,
      value: counts[m.key] || 0,
    }));
  }, [counts, filteredModelCards]);

  return {
    counts,
    loading,
    chartData,
    isCreator,
    filteredModelCards,
    totalItems,
    leads,
    refresh: () => setRefreshKey((k) => k + 1),
  };
};

function BarChartCard({ data }) {
  const t = useChartTokens();
  const gradId = React.useId();

  return (
    <Card className="min-w-0 border-gray-200/70 dark:border-gray-900 bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          Content Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RBarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            barCategoryGap={24}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.primaryFrom} />
                <stop offset="100%" stopColor={t.primaryTo} />
              </linearGradient>

              {/* slightly richer hover */}
              <linearGradient
                id={`${gradId}-hover`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={t.primaryFrom}
                  stopOpacity="0.98"
                />
                <stop
                  offset="100%"
                  stopColor={t.primaryTo}
                  stopOpacity="0.98"
                />
              </linearGradient>

              <filter
                id={`${gradId}-shadow`}
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="1.5"
                  stdDeviation="2"
                  floodColor={t.shadow}
                />
              </filter>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke={t.border}
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: t.tick, fontSize: 12 }}
              tickMargin={6}
              axisLine={{ stroke: t.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: t.tick, fontSize: 12 }}
              axisLine={{ stroke: t.border }}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip
              cursor={{ fill: t.cursorFill }}
              contentStyle={{
                background: t.tooltipBg,
                border: `1px solid ${t.border}`,
                borderRadius: 8,
                color: t.tooltipFg,
                boxShadow: "0 8px 30px rgba(0,0,0,.12)",
              }}
            />

            <Bar
              dataKey="value"
              fill={`url(#${gradId})`}
              radius={[8, 8, 0, 0]}
              maxBarSize={42}
              style={{ filter: `url(#${gradId}-shadow)` }}
              animationDuration={450}
              activeBar={
                <Rectangle
                  fill={`url(#${gradId}-hover)`}
                  radius={[8, 8, 0, 0]}
                  stroke="transparent"
                />
              }
            />
          </RBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function LeadsCard({ items }) {
  const navigate = useNavigate();
  return (
    <Card className="min-w-0 border-gray-200/70 dark:border-gray-900 bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base">Recent Leads</CardTitle>
      </CardHeader>
      <CardContent>
        {items?.length ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-900">
            {items.map((l, i) => (
              <li
                onClick={() => {
                  navigate(`/content/lead/${l._id}`);
                }}
                key={l._id || i}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {l.name || l.fullName || l.email || "Lead"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {(
                      l.email ||
                      l.phone ||
                      l.message ||
                      l.subject ||
                      ""
                    ).toString()}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {formatDate(l.createdAt)}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">No leads yet.</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions({ isCreator = false }) {
  const modelsToShow = isCreator
    ? ["blog", "tour", "enquiries", "testimonial"] // Include Testimonial for creators
    : ["blog", "destinations", "experiences", "tour"]; // Default models for non-creators
  return (
    <Card className="min-w-0 border-gray-200/70 dark:border-gray-900 bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid   [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-2">
        {MODEL_CARDS.filter((m) => modelsToShow.includes(m.key)).map((m) => (
          <Button
            key={m.key}
            asChild
            variant="outline"
            className="justify-start"
          >
            <a href={`/content/${m.key}/create`}>
              <ExternalLink className="mr-2 h-4 w-4" /> New {m.label}
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}

export default function Dashboard() {
  const { data: currentuser } = useCurrentUser(); // Fetch the current user inside the hook
  const isCreator = currentuser?.roleName === "creator"; // Check if the user is a creator

  const {
    counts,
    loading,
    chartData,
    totalItems,
    leads,
    refresh,
    filteredModelCards,
  } = useDashboardData();

  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10  bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-full ">
            <Header
              title="Dashboard"
              right={
                <Button variant="secondary" onClick={refresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              }
            />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-y-scroll">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">Total Items: {totalItems}</Badge>
                <Badge variant="secondary" className="text-xs">
                  Models: {filteredModelCards.length}
                </Badge>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
              {filteredModelCards.map((m) => (
                <CountCard
                  key={m.key}
                  label={m.label}
                  icon={m.icon}
                  value={loading ? "—" : counts[m.key] ?? 0}
                  href={m.label === "Users" ? `/users` : `/content/${m.key}`}
                  loading={loading}
                />
              ))}
            </div>

            <Tabs
              defaultValue="overview"
              className="space-y-4 py-6 sm:space-y-6"
            >
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="leads">
                  {isCreator ? "Enquiries" : "Leads"}
                </TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2 min-w-0">
                    <BarChartCard data={chartData} />
                  </div>
                  <div className="min-w-0">
                    <Card className="border-gray-200/70 dark:border-gray-900 bg-white dark:bg-gray-900">
                      <CardHeader>
                        <CardTitle className="text-base">At a glance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Blogs</span>
                          <span>{counts.blog ?? 0}</span>
                        </div>
                        {!isCreator && (
                          <div className="flex items-center justify-between">
                            <span>Destinations</span>
                            <span>{counts.destinations ?? 0}</span>
                          </div>
                        )}
                        {!isCreator && (
                          <div className="flex items-center justify-between">
                            <span>Experiences</span>
                            <span>{counts.experiences ?? 0}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>Tours</span>
                          <span>{counts.tour ?? 0}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span>Testimonials</span>
                          <span>{counts.testimonial ?? 0}</span>
                        </div>

                        {!isCreator && (
                          <div className="flex items-center justify-between">
                            <span>Categories</span>
                            <span>{counts.categories ?? 0}</span>
                          </div>
                        )}
                        {!isCreator && (
                          <div className="flex items-center justify-between">
                            <span>Users</span>
                            <span>{counts.users ?? 0}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="leads">
                <LeadsCard items={leads} />
              </TabsContent>
              <TabsContent value="actions">
                <QuickActions isCreator={isCreator} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

function useChartTokens() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return {
    // bars
    primaryFrom: isDark ? "#818cf8" : "#6366f1", // indigo-400/500
    primaryTo: isDark ? "#c084fc" : "#a855f7", // purple-400/500
    // axes/grid
    border: isDark ? "#30343d" : "#e5e7eb",
    tick: isDark ? "#9ca3af" : "#6b7280",
    // tooltip + hover overlay
    tooltipBg: isDark ? "#0b1220" : "#ffffff",
    tooltipFg: isDark ? "#e5e7eb" : "#111827",
    cursorFill: isDark ? "rgba(168,85,247,0.18)" : "rgba(99,102,241,0.12)",
    // drop-shadow color
    shadow: isDark ? "rgba(192,132,252,.35)" : "rgba(99,102,241,.28)",
  };
}
