"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  ShieldCheck,
  CalendarClock,
  Ban,
  Infinity as InfinityIcon,
  Search,
  Filter,
  Users,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClientValidityCard } from "./ClientValidityCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ClientLite = {
  _id: string;
  clientUsername: string;
  contactName: string;
  email: string;
  phone?: string;
  slug: string;
};

type Validity = {
  enabled: boolean;
  status:
    | "active"
    | "expired"
    | "suspended"
    | "unlimited"
    | "unknown"
    | "disabled";
  expiresAt?: string | null;
  startAt?: string | null;
};

export function ClientsValidityManager() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL!;
  const { toast } = useToast();

  const [clients, setClients] = React.useState<ClientLite[]>([]);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [validityByClient, setValidityByClient] = React.useState<
    Record<string, Validity>
  >({});
  const [isValidityLoading, setIsValidityLoading] = React.useState(false);

  const [selectedClient, setSelectedClient] = React.useState<ClientLite | null>(
    null
  );
  const lower = (v: unknown) => (v ?? "").toString().toLowerCase();
  const hasText = (v: unknown, q: string) => lower(v).includes(q);

  const [open, setOpen] = React.useState(false);

  function toValidity(raw: any): Validity {
    // Unwrap common API shapes
    const v = raw?.validity ?? raw?.data ?? raw ?? {};
    const allowed = new Set([
      "active",
      "expired",
      "suspended",
      "unlimited",
      "unknown",
      "disabled",
    ]);
    const status = allowed.has(v?.status) ? v.status : "unknown";
    return {
      enabled: status === "active" || status === "unlimited",
      status,
      expiresAt: v?.expiresAt ?? null,
      startAt: v?.startAt ?? null,
    };
  }

  // fetch all clients
  React.useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const res = await fetch(`${baseURL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await res.json();

        const list: ClientLite[] = Array.isArray(data)
          ? data
          : data.clients || [];
        setClients(list);

        setIsValidityLoading(true);
        const results = await Promise.allSettled(
          list.map(async (c) => {
            const vr = await fetch(`${baseURL}/api/account/${c._id}/validity`, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            });

            // Treat 404 as "no validity yet" rather than throwing
            if (vr.status === 404) return { id: c._id, validity: null };

            if (!vr.ok) {
              const body = await vr.text().catch(() => "");
              throw new Error(
                `GET validity ${vr.status} for ${c.clientUsername}: ${body}`
              );
            }

            // Unwrap to inner doc
            const json = await vr.json(); // { ok, validity }
            return { id: c._id, validity: toValidity(json) };
          })
        );

        const map: Record<string, Validity> = {};
        for (const r of results) {
          if (r.status === "fulfilled") {
            map[r.value.id] = r.value.validity ?? {
              enabled: false,
              status: "unknown",
              expiresAt: null,
              startAt: null,
            };
          } else {
            console.warn("[validity] fetch failed:", r.reason);
          }
        }
        setValidityByClient(map);
        setIsValidityLoading(false);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Failed to load clients",
          description: e instanceof Error ? e.message : "Something went wrong.",
        });
      } finally {
        setIsValidityLoading(false);
        setIsLoading(false);
      }
    })();
  }, [baseURL, toast]);

  const filtered = React.useMemo(() => {
    const q = lower(search.trim());
    const status = statusFilter;

    return clients.filter((c) => {
      // be defensive: any field may be missing/null
      const matchesSearch =
        q.length === 0 ||
        hasText(c?.clientUsername, q) ||
        hasText(c?.contactName, q) ||
        hasText(c?.email, q) ||
        hasText(c?.slug, q) ||
        hasText(c?.phone, q);

      const clientValidity = validityByClient[c?._id];
      const matchesFilter =
        status === "all" ||
        (status === "active" && clientValidity?.status === "active") ||
        (status === "expired" && clientValidity?.status === "expired") ||
        (status === "suspended" && clientValidity?.status === "suspended") ||
        (status === "unlimited" && clientValidity?.status === "unlimited") ||
        (status === "unknown" &&
          (!clientValidity || clientValidity.status === "unknown"));

      return matchesSearch && matchesFilter;
    });
  }, [clients, search, statusFilter, validityByClient]);

  

  function StatusBadge({ validity }: { validity?: Validity }) {
    const status = (validity?.status ?? "unknown") as Validity["status"];

    const badgeConfig = {
      active: {
        class: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5" />,
      },
      expired: {
        class: "bg-red-100 text-red-800 border-red-200",
        icon: <CalendarClock className="h-3.5 w-3.5 mr-1" />,
      },
      suspended: {
        class: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Ban className="h-3.5 w-3.5 mr-1" />,
      },
      unlimited: {
        class: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <InfinityIcon className="h-3.5 w-3.5 mr-1" />,
      },
      unknown: {
        class: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <div className="w-2 h-2 bg-gray-500 rounded-full mr-1.5" />,
      },
      disabled: {
        class: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Ban className="h-3.5 w-3.5 mr-1" />,
      },
    } as const;

    const config = badgeConfig[status] ?? badgeConfig.unknown;
    const label =
      (status[0]?.toUpperCase() ?? "U") + (status.slice(1) ?? "nknown");

    return (
      <Badge
        variant="outline"
        className={`flex items-center py-1 px-2.5 ${config.class}`}
      >
        {config.icon}
        {label}
      </Badge>
    );
  }
  function fmt(d?: string | null) {
    if (!d) return "—";
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(t));
  }

  const handleManage = (c: ClientLite) => {
    setSelectedClient(c);
    setOpen(true);
  };

  // refresh a single client's validity after saving in the dialog
  const refreshOne = async (clientId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");

      const r = await fetch(`${baseURL}/api/account/${clientId}/validity`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (r.status === 404) {
        setValidityByClient((prev) => ({
          ...prev,
          [clientId]: {
            enabled: false,
            status: "unknown",
            expiresAt: null,
            startAt: null,
          },
        }));
        return;
      }

      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new Error(`Refresh failed ${r.status}: ${body}`);
      }

      const json = await r.json(); // { ok, validity }
      const v = toValidity(json);

      setValidityByClient((prev) => ({ ...prev, [clientId]: v }));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not refresh validity",
        description: e instanceof Error ? e.message : "Something went wrong.",
      });
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-muted/40 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Validity Management
            </CardTitle>
            <CardDescription>
              Manage account validity for all clients
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, email, or contact..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
  {/* Mobile View Cards */}
    <div className="space-y-4 md:hidden"> {/* Mobile View Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-1">No clients found</h3>
          <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        filtered.map((c) => {
          const v = validityByClient[c._id];
          return (
            <Card key={c._id} className="border p-4 mb-4">
              <CardHeader className="flex justify-between items-center">
                <div className="text-lg font-medium">{c.clientUsername}</div>
                <StatusBadge validity={v} />
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-2">{c.contactName}</div>
                <div className="text-sm mb-2">{fmt(v?.expiresAt)}</div>
                <Button size="sm" onClick={() => handleManage(c)} className="w-3/4 mx-auto">
                  <ShieldCheck className="h-3.5 w-3.5" /> Manage
                </Button>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {clients.length}
              </div>
              <div className="text-xs text-blue-800">Total Clients</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "active"
                  ).length
                }
              </div>
              <div className="text-xs text-emerald-800">Active</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "expired"
                  ).length
                }
              </div>
              <div className="text-xs text-red-800">Expired</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {
                  clients.filter(
                    (c) => validityByClient[c._id]?.status === "suspended"
                  ).length
                }
              </div>
              <div className="text-xs text-amber-800">Disabled</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {
                  clients.filter(
                    (c) =>
                      !validityByClient[c._id] ||
                      validityByClient[c._id]?.status === "unknown"
                  ).length
                }
              </div>
              <div className="text-xs text-gray-800">Unknown</div>
            </div>
          </div>

          {/* Clients Table */}
          <div className="rounded-lg border overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-1">No clients found</h3>
                <p className="text-muted-foreground text-sm">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "No clients available in the system"}
                </p>
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">
                        Contact Info
                      </TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Expires</TableHead>
                      <TableHead className="font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => {
                      const v = validityByClient[c._id];
                      return (
                        <TableRow key={c._id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{c.clientUsername}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.slug}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{c.contactName}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="truncate max-w-[160px]">
                                  {c.email}
                                </span>
                              </div>
                              {c.phone && (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{c.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isValidityLoading && !v ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-sm">Loading…</span>
                              </div>
                            ) : (
                              <StatusBadge validity={v} />
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{fmt(v?.expiresAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleManage(c)}
                              className="gap-1.5"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Pagination would go here */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {filtered.length} of {clients.length} clients
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Manage Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Manage Client Validity
              </DialogTitle>
              <DialogDescription>
                Configure access and expiry for{" "}
                <span className="font-medium text-foreground">
                  {selectedClient?.clientUsername}
                </span>
              </DialogDescription>
            </DialogHeader>

            {selectedClient ? (
              <ClientValidityCard
                clientId={selectedClient._id}
                onChanged={() => {
                  refreshOne(selectedClient._id);
                  setOpen(false);
                }}
              />
            ) : (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
