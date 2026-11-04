import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  Globe,
  Bell,
  Save,
  Plus,
  Check,
  ChevronRight,
  ArrowRight,
  MapPin,
  Bus,
  Trash2,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import { useActiveTenant, SALEM_TENANT_ID, CHENNAI_MTC_TENANT_ID } from "@/lib/tenant-context";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Transport Setup & Settings: TransitOS" },
      {
        name: "description",
        content:
          "Configure operational depot rules, departure buffers, and operating corporation profiles.",
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
    removeTenant,
  } = useActiveTenant();

  // Register New Tenant Modal State
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newCorpName, setNewCorpName] = useState("");
  const [newCorpCode, setNewCorpCode] = useState("");
  const [newCorpRegion, setNewCorpRegion] = useState("");
  const [newCorpDepotName, setNewCorpDepotName] = useState("");
  const [newCorpDepotCode, setNewCorpDepotCode] = useState("");
  const [newCorpFleet, setNewCorpFleet] = useState("32");
  const [isRegistering, setIsRegistering] = useState(false);

  // Delete Tenant Dialog State
  const [corpToDelete, setCorpToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCorp, setIsDeletingCorp] = useState(false);

  // Organization state
  const [orgName, setOrgName] = useState("Salem Transport Corporation");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST +05:30)");
  const [contactEmail, setContactEmail] = useState("ops@salemtransport.gov.in");

  // Operational Rules state (Depot buffers)
  const [turnaroundBuffer, setTurnaroundBuffer] = useState("15");
  const [reliefWindow, setReliefWindow] = useState("20");
  const [garageDepartureBuffer, setGarageDepartureBuffer] = useState("10");

  // Notifications state
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  const [smsDispatch, setSmsDispatch] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Depot configuration and system parameters updated.");
    }, 400);
  };

  const handleRegisterCorporation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCorpName.trim() || !newCorpCode.trim()) {
      toast.error("Please enter a corporation name and short code.");
      return;
    }
    setIsRegistering(true);
    try {
      const created = await registerTenant({
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
      toast.success(`Corporation ${created.name} registered and activated with starter fleet & corridors.`);
      setShowNewTenantModal(false);
      setNewCorpName("");
      setNewCorpCode("");
      setNewCorpRegion("");
      setNewCorpDepotName("");
      setNewCorpDepotCode("");
      setNewCorpFleet("32");
    } catch (err: any) {
      toast.error(err.message || "Failed to register corporation.");
    } finally {
      setIsRegistering(false);
    }
  };

  const confirmDeleteCorporation = async () => {
    if (!corpToDelete) return;
    setIsDeletingCorp(true);
    try {
      await removeTenant(corpToDelete.id);
      toast.success(`Corporation "${corpToDelete.name}" removed successfully.`);
      setCorpToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to remove corporation.");
    } finally {
      setIsDeletingCorp(false);
    }
  };

  return (
    <AppShell
      title="Transport Setup & Settings"
      subtitle="Configure operational depot rules, departure buffers, and operating corporation profiles."
      actions={
        canManage ? (
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
          >
            <Save className="mr-1.5 size-3.5" />
            {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* End-to-End Workflow Progress Banner */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-white text-xs font-bold font-mono">
              1
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Transport Setup (Step 1 of 6)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set up operating depots and shift buffers. Once configured,
                proceed to Routes.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs shrink-0"
          >
            <Link to="/network/routes">
              <span>Next: Set Up Routes</span>
              <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        {/* Corporation & Depot Status Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center font-bold">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {activeTenant.name}
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5 rounded-md"
                >
                  {activeTenant.code}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-muted-foreground/30 text-muted-foreground bg-muted/20 rounded-md"
                >
                  {activeTenant.region}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Active Depot: <span className="font-semibold text-foreground">{activeDepot.name}</span> ({activeDepot.code}) | Fleet Size: {activeTenant.fleetSize} Buses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs font-mono rounded-md"
            >
              System Online
            </Badge>
          </div>
        </div>

        {/* Simplified Settings Tabs */}
        <Tabs defaultValue="depot" className="space-y-6">
          <TabsList className="bg-secondary/40 p-1 rounded-md border border-border/60">
            <TabsTrigger
              value="depot"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Clock className="size-3.5" /> Depot Rules & Buffers
            </TabsTrigger>
            <TabsTrigger
              value="corporations"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Building2 className="size-3.5" /> Transport Divisions & Depots
            </TabsTrigger>
            <TabsTrigger
              value="organization"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Globe className="size-3.5" /> Organization Details
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="text-xs gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-xs rounded-md"
            >
              <Bell className="size-3.5" /> Dispatch Alerts
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DEPOT RULES & OPERATIONAL BUFFERS */}
          <TabsContent value="depot">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="rounded-lg border border-border/80 bg-card p-6 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Operational Turnaround & Departure Buffers
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure standard terminal layover times and dispatch buffers for daily trips.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Terminal Layover Buffer (Minutes)
                    </Label>
                    <Input
                      type="number"
                      value={turnaroundBuffer}
                      onChange={(e) => setTurnaroundBuffer(e.target.value)}
                      disabled={!canManage}
                      className="h-9 text-xs rounded-md"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Minimum rest time between consecutive trips at terminus.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Crew Relief Window (Minutes)
                    </Label>
                    <Input
                      type="number"
                      value={reliefWindow}
                      onChange={(e) => setReliefWindow(e.target.value)}
                      disabled={!canManage}
                      className="h-9 text-xs rounded-md"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Window allowed for driver handover at designated stops.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground">
                      Garage Departure Buffer (Minutes)
                    </Label>
                    <Input
                      type="number"
                      value={garageDepartureBuffer}
                      onChange={(e) => setGarageDepartureBuffer(e.target.value)}
                      disabled={!canManage}
                      className="h-9 text-xs rounded-md"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Lead time for bus rollout from depot bay to starting terminus.
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Note: </span>
                  Standard driver rest intervals (minimum 8 hours between shifts) and continuous driving limits are maintained automatically in the scheduling engine.
                </div>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: CORPORATIONS & DEPOTS */}
          <TabsContent value="corporations" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Transport Divisions & Depot Network
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Switch active operating division or register regional depots.
                </p>
              </div>
              {canManage && (
                <Button
                  onClick={() => setShowNewTenantModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
                >
                  <Plus className="mr-1.5 size-3.5" />
                  Register Corporation
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tenants.map((corp) => {
                const isActive = corp.id === activeTenant.id;
                return (
                  <div
                    key={corp.id}
                    className={`rounded-lg border p-5 flex flex-col justify-between transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-500/5 shadow-xs"
                        : "border-border/80 bg-card hover:border-border"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {corp.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {corp.region}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-primary/30 text-primary rounded-md"
                        >
                          {corp.code}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Bus className="size-3.5 text-primary" />
                          {corp.fleetSize} Buses
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5 text-muted-foreground" />
                          {corp.depots.length} Depots
                        </span>
                      </div>

                      {/* Depots List */}
                      <div className="pt-2 border-t border-border/60 space-y-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Operating Depots:
                        </p>
                        {corp.depots.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/40"
                          >
                            <span className="font-medium text-foreground">{d.name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {d.activeBuses} active
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60">
                      {isActive ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="size-4" />
                            <span>Currently Selected Division</span>
                          </div>
                          {corp.id !== SALEM_TENANT_ID && corp.id !== CHENNAI_MTC_TENANT_ID && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCorpToDelete({ id: corp.id, name: corp.name })}
                              className="h-7 px-2 text-muted-foreground hover:text-rose-600 rounded-md cursor-pointer text-xs"
                              title="Remove Corporation"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              <span>Remove</span>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActiveTenantId(corp.id);
                              toast.success(`Switched to ${corp.name}`);
                            }}
                            className="flex-1 text-xs rounded-md"
                          >
                            Switch to Division
                          </Button>
                          {corp.id !== SALEM_TENANT_ID && corp.id !== CHENNAI_MTC_TENANT_ID && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCorpToDelete({ id: corp.id, name: corp.name })}
                              className="h-8 px-2 text-muted-foreground hover:text-rose-600 rounded-md cursor-pointer"
                              title="Remove Corporation"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: ORGANIZATION PROFILE */}
          <TabsContent value="organization">
            <div className="rounded-lg border border-border/80 bg-card p-6 space-y-5 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Operating Division Profile
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  General identification and contact information.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    Corporation Name
                  </Label>
                  <Input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={!canManage}
                    className="h-9 text-xs rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    Regional Timezone
                  </Label>
                  <Input
                    value={timezone}
                    disabled
                    className="h-9 text-xs bg-muted/50 rounded-md font-mono"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground">
                    Operations Dispatch Contact Email
                  </Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={!canManage}
                    className="h-9 text-xs rounded-md"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: NOTIFICATIONS */}
          <TabsContent value="notifications">
            <div className="rounded-lg border border-border/80 bg-card p-6 space-y-5 shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Dispatch & Operational Alerts
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which operational updates should trigger notifications.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Vehicle Disruption & Breakdown Alerts
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Instant alerts when an in-service bus reports mechanical difficulty or delay.
                    </p>
                  </div>
                  <Switch
                    checked={incidentAlerts}
                    onCheckedChange={setIncidentAlerts}
                    disabled={!canManage}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-muted/20">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground">
                      Crew Shift SMS Notifications
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Send daily shift schedules and reporting depot to crew mobile devices.
                    </p>
                  </div>
                  <Switch
                    checked={smsDispatch}
                    onCheckedChange={setSmsDispatch}
                    disabled={!canManage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal: Register Corporation */}
        <Dialog open={showNewTenantModal} onOpenChange={setShowNewTenantModal}>
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Register Transport Corporation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add an operational division to the multi-tenant system.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRegisterCorporation} className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Corporation Name</Label>
                <Input
                  placeholder="e.g. Tirunelveli City Transport"
                  value={newCorpName}
                  onChange={(e) => setNewCorpName(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Short Code</Label>
                  <Input
                    placeholder="e.g. TN-TCT-TIN"
                    value={newCorpCode}
                    onChange={(e) => setNewCorpCode(e.target.value)}
                    className="h-8.5 text-xs font-mono uppercase rounded-md"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fleet Size</Label>
                  <Input
                    type="number"
                    value={newCorpFleet}
                    onChange={(e) => setNewCorpFleet(e.target.value)}
                    className="h-8.5 text-xs rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Region</Label>
                <Input
                  placeholder="e.g. Tirunelveli, Tamil Nadu"
                  value={newCorpRegion}
                  onChange={(e) => setNewCorpRegion(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Primary Depot Name</Label>
                <Input
                  placeholder="e.g. Vannarpettai Central Depot"
                  value={newCorpDepotName}
                  onChange={(e) => setNewCorpDepotName(e.target.value)}
                  className="h-8.5 text-xs rounded-md"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewTenantModal(false)}
                  size="sm"
                  className="text-xs rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isRegistering}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md"
                >
                  {isRegistering ? "Registering..." : "Register Division"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Corporation Confirmation Dialog */}
        <Dialog
          open={!!corpToDelete}
          onOpenChange={(open) => !open && setCorpToDelete(null)}
        >
          <DialogContent className="sm:max-w-md rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Remove Transport Corporation
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-foreground">
                  {corpToDelete?.name}
                </span>
                ? This will permanently delete its associated buses, crew rosters, and route corridors.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCorpToDelete(null)}
                size="sm"
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteCorporation}
                disabled={isDeletingCorp}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-md"
              >
                {isDeletingCorp ? "Removing..." : "Confirm Removal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
