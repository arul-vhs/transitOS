import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Sliders,
  ShieldCheck,
  Zap,
  Bell,
  Save,
  Clock,
  Bus as BusIcon,
  Users,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Lock,
  Globe,
  Radio,
  Cpu,
  Plus,
  Check,
  Layers,
  Shield,
  ArrowRight,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { useActiveTenant } from "@/lib/tenant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (
      !context.user ||
      !hasPermission(context.user.role, "organization.view")
    ) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "System & Depot Settings: TransitOS" },
      {
        name: "description",
        content:
          "Depot rules, labor compliance limits and optimizer solver weights.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "organization.manage");

  // Multi-Tenant context
  const {
    activeTenant,
    activeDepot,
    tenants,
    setActiveTenantId,
    setActiveDepotId,
    registerTenant,
  } = useActiveTenant();

  // Register New Tenant Modal State
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newCorpName, setNewCorpName] = useState("");
  const [newCorpCode, setNewCorpCode] = useState("");
  const [newCorpRegion, setNewCorpRegion] = useState("");
  const [newCorpDepotName, setNewCorpDepotName] = useState("");
  const [newCorpDepotCode, setNewCorpDepotCode] = useState("");
  const [newCorpFleet, setNewCorpFleet] = useState("32");

  // Organization state
  const [orgName, setOrgName] = useState("Salem Transport Corporation");
  const [depotCode, setDepotCode] = useState("SLM-CENTRAL-01");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST +05:30)");
  const [contactEmail, setContactEmail] = useState("ops@salemtransport.gov.in");

  // Operational Rules state
  const [turnaroundBuffer, setTurnaroundBuffer] = useState("15");
  const [reliefWindow, setReliefWindow] = useState("20");
  const [garageDepartureBuffer, setGarageDepartureBuffer] = useState("10");

  // Labor & MV Act state
  const [maxContinuousDriving, setMaxContinuousDriving] = useState("240");
  const [mandatoryRest, setMandatoryRest] = useState("480");
  const [maxWeeklyHours, setMaxWeeklyHours] = useState("48");
  const [maxSpreadover, setMaxSpreadover] = useState("720");

  // Optimizer Weights state
  const [deadheadWeight, setDeadheadWeight] = useState("2.5");
  const [handoverWeight, setHandoverWeight] = useState("1.8");
  const [solverTimeout, setSolverTimeout] = useState("120");

  // Notifications state
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  const [smsDispatch, setSmsDispatch] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    "https://hooks.slack.com/services/T00/B00/XXXX",
  );

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Depot configuration and system parameters updated.");
    }, 450);
  };

  const handleRegisterCorporation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorpName.trim() || !newCorpCode.trim()) {
      toast.error("Please enter a corporation name and short code.");
      return;
    }
    const created = registerTenant({
      name: newCorpName.trim(),
      code: newCorpCode.trim().toUpperCase(),
      region: newCorpRegion.trim() || "Tamil Nadu Transit Division",
      fleetSize: parseInt(newCorpFleet, 10) || 28,
      routesCount: 8,
      depots: [
        {
          id: `depot-${Date.now()}`,
          name: newCorpDepotName.trim() || `${newCorpName.trim()} Main Depot`,
          code:
            newCorpDepotCode.trim().toUpperCase() ||
            `${newCorpCode.trim()}-MAIN-01`,
          capacity: 45,
          activeBuses: Math.floor((parseInt(newCorpFleet, 10) || 28) * 0.8),
        },
      ],
    });
    toast.success(`Corporation ${created.name} registered and activated.`);
    setShowNewTenantModal(false);
    setNewCorpName("");
    setNewCorpCode("");
    setNewCorpRegion("");
    setNewCorpDepotName("");
    setNewCorpDepotCode("");
    setNewCorpFleet("32");
  };

  return (
    <AppShell
      title="Depot & System Settings"
      subtitle="Enterprise tenant isolation, Motor Vehicle Act labor parameters, and optimizer solver weights."
      actions={
        canManage ? (
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:scale-[1.02] transition-all rounded-lg"
          >
            <Save className="mr-1.5 size-3.5" />
            {saving ? "Saving Changes..." : "Save Configuration"}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* Tenant Status Bar */}
        <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {activeTenant.name}
                </h3>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono border-primary/30 text-primary bg-primary/5 rounded-md"
                >
                  {activeTenant.code}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono border-muted-foreground/30 text-muted-foreground bg-muted/20 rounded-md"
                >
                  {activeTenant.region}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Active Depot: {activeDepot.name} ({activeDepot.code}) - Fleet
                Quota: {activeTenant.fleetSize} Buses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs font-mono rounded-md"
            >
              ● Tenant Active
            </Badge>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="bg-secondary/40 p-1 rounded-xl border border-border/60">
            <TabsTrigger
              value="tenants"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Building2 className="size-3.5" /> Multi-Tenant Corporations
            </TabsTrigger>
            <TabsTrigger
              value="rules"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Clock className="size-3.5" /> Depot Rules & Buffers
            </TabsTrigger>
            <TabsTrigger
              value="labor"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <ShieldCheck className="size-3.5" /> Labor & MV Act Limits
            </TabsTrigger>
            <TabsTrigger
              value="optimizer"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Cpu className="size-3.5" /> Solver Weights
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Globe className="size-3.5" /> Organization Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Bell className="size-3.5" /> Notifications & Webhooks
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: MULTI-TENANT CORPORATIONS */}
          <TabsContent value="tenants" className="space-y-6">
            <div className="glass-panel p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Building2 className="size-4 text-primary" /> State
                    Transport Corporations & Multi-Tenant Divisions
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage transit authority partitions. Each corporation runs
                    with strictly isolated fleet inventories, timetables, and
                    driver rosters.
                  </p>
                </div>
                <Dialog
                  open={showNewTenantModal}
                  onOpenChange={setShowNewTenantModal}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg gap-1.5 shrink-0"
                    >
                      <Plus className="size-3.5" /> Register Corporation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <Building2 className="size-4 text-primary" /> Register
                        New Transit Corporation
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Create an isolated multi-tenant corporation partition
                        with dedicated depot allocations.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleRegisterCorporation}
                      className="space-y-4 py-2"
                    >
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Corporation Name
                        </Label>
                        <Input
                          placeholder="e.g. Tirunelveli Regional Transit"
                          value={newCorpName}
                          onChange={(e) => setNewCorpName(e.target.value)}
                          className="text-xs bg-background/70"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Short Code
                          </Label>
                          <Input
                            placeholder="TN-TRT-TNV"
                            value={newCorpCode}
                            onChange={(e) => setNewCorpCode(e.target.value)}
                            className="text-xs font-mono uppercase bg-background/70"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Region / Division
                          </Label>
                          <Input
                            placeholder="Tirunelveli South"
                            value={newCorpRegion}
                            onChange={(e) => setNewCorpRegion(e.target.value)}
                            className="text-xs bg-background/70"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Primary Depot Name
                          </Label>
                          <Input
                            placeholder="Vannarpettai Central Depot"
                            value={newCorpDepotName}
                            onChange={(e) =>
                              setNewCorpDepotName(e.target.value)
                            }
                            className="text-xs bg-background/70"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">
                            Fleet Quota (Buses)
                          </Label>
                          <Input
                            type="number"
                            min="10"
                            max="500"
                            value={newCorpFleet}
                            onChange={(e) => setNewCorpFleet(e.target.value)}
                            className="text-xs font-mono bg-background/70"
                          />
                        </div>
                      </div>
                      <DialogFooter className="pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowNewTenantModal(false)}
                          className="text-xs rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-primary text-primary-foreground font-semibold text-xs rounded-lg"
                        >
                          Confirm & Activate Partition
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Tenant Roster Table */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background/40">
                <Table>
                  <TableHeader className="bg-secondary/40 text-[11px]">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">
                        Corporation Name
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Code
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Operating Region
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center">
                        Depots
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center">
                        Fleet Quota
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center">
                        Routes
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-center">
                        Status
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-right">
                        Switch Context
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs font-mono">
                    {tenants.map((t) => {
                      const isActive = t.id === activeTenant.id;
                      return (
                        <TableRow
                          key={t.id}
                          className={cn(isActive && "bg-primary/5")}
                        >
                          <TableCell className="font-sans font-semibold text-foreground">
                            {t.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] rounded-md font-mono"
                            >
                              {t.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-sans text-muted-foreground">
                            {t.region}
                          </TableCell>
                          <TableCell className="text-center font-bold">
                            {t.depots.length}
                          </TableCell>
                          <TableCell className="text-center text-foreground font-bold">
                            {t.fleetSize}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {t.routesCount}
                          </TableCell>
                          <TableCell className="text-center">
                            {isActive ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] rounded-md">
                                ● Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-[10px] text-muted-foreground rounded-md"
                              >
                                Standby
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-7 text-[11px] font-sans rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              >
                                <Check className="size-3 mr-1" /> Current
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setActiveTenantId(t.id);
                                  toast.success(
                                    `Switched operating tenant to ${t.name}`,
                                  );
                                }}
                                className="h-7 text-[11px] font-sans font-semibold rounded-md hover:bg-primary hover:text-primary-foreground transition-all"
                              >
                                Switch Context
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Multi-Tenant Security & Isolation Architecture Card */}
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Shield className="size-4" /> Row-Level Tenant Isolation
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Database tables enforce tenant_id constraints so records for
                    one corporation cannot be read or modified by another.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Layers className="size-4" /> Multi-Depot Fleet Partitioning
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Each corporation manages its assigned depots, maintenance
                    bays, and vehicle registration inventories independently.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/60 bg-secondary/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Users className="size-4" /> Labor Union Roster Scopes
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Crew assignments, driver overtime calculation, and rest
                    rules adhere strictly to the active corporation
                    jurisdiction.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 1: DEPOT RULES */}
          <TabsContent value="rules" className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Turnaround & Headway Parameters
                </h3>
                <p className="text-xs text-muted-foreground">
                  Define depot buffer intervals applied during automatic
                  schedule generation
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Terminal Turnaround Buffer
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={turnaroundBuffer}
                      onChange={(e) => setTurnaroundBuffer(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Minimum layover between inbound and outbound trips
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Relief Handover Window
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={reliefWindow}
                      onChange={(e) => setReliefWindow(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Buffer allotted for driver sign-off & ticket audit
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Garage Pull-Out Buffer
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={garageDepartureBuffer}
                      onChange={(e) => setGarageDepartureBuffer(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Pre-trip inspection time before first departure
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: LABOR & MV ACT */}
          <TabsContent value="labor" className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-foreground">
                    Motor Vehicles Act (1988) Labor Compliance
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Hard and soft constraint thresholds enforced across duty
                  builders and optimizer
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">
                      Max Continuous Driving Stretch
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono text-emerald-600 border-emerald-500/30"
                    >
                      Mandatory
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxContinuousDriving}
                      onChange={(e) => setMaxContinuousDriving(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Section 13: Drivers must not exceed 4 continuous hours (240
                    min) without rest
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">
                      Mandatory Shift Recovery Rest
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-mono text-emerald-600 border-emerald-500/30"
                    >
                      Mandatory
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      value={mandatoryRest}
                      onChange={(e) => setMandatoryRest(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Minimum 8 hours (480 min) off-duty rest required before next
                    sign-on
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Maximum Weekly Driving Limit
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxWeeklyHours}
                      onChange={(e) => setMaxWeeklyHours(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      hours
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Standard 48-hour weekly ceiling per driver roster cycle
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-secondary/20 space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Maximum Spreadover Window
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxSpreadover}
                      onChange={(e) => setMaxSpreadover(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      mins
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Total elapsed time from first sign-on to final sign-off (max
                    12 hours)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: OPTIMIZER WEIGHTS */}
          <TabsContent value="optimizer" className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Mathematical Solver Objective Penalties
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tune MILP cost coefficients to prioritize minimal fleet count
                  or crew continuity
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Deadhead Distance Penalty
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={deadheadWeight}
                    onChange={(e) => setDeadheadWeight(e.target.value)}
                    className="bg-background/60 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Multiplier weighting for non-revenue kilometers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Relief Handover Cost
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={handoverWeight}
                    onChange={(e) => setHandoverWeight(e.target.value)}
                    className="bg-background/60 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Penalty against unlinked mid-shift crew swaps
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Solver Timeout Limit
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={solverTimeout}
                      onChange={(e) => setSolverTimeout(e.target.value)}
                      className="bg-background/60 text-xs font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                      sec
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Maximum branch-and-cut optimization search time
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: ORGANIZATION */}
          <TabsContent value="organization" className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Organization & Tenant Profile
                </h3>
                <p className="text-xs text-muted-foreground">
                  Core transit authority details and geographic locality
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Tenant Corporation Name
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="bg-background/60 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Primary Depot Code
                  </Label>
                  <Input
                    value={depotCode}
                    onChange={(e) => setDepotCode(e.target.value)}
                    className="bg-background/60 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Operational Timezone
                  </Label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-background/60 text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Operations Contact Email
                  </Label>
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="bg-background/60 text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <div className="border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground">
                  Incident Telemetry & Webhooks
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automated dispatches to operations rooms and field supervisors
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">
                    Disruption Webhook Endpoint (Slack / Discord)
                  </Label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="bg-background/60 text-xs font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Payload fired whenever a high or critical incident is logged
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
