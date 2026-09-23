import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  FileText,
  IdCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  CalendarClock,
  Ticket,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getConductors,
  getCrewMember,
  createCrewMember,
  updateCrewMember,
  updateCrewStatus,
} from "@/lib/fleet-crew";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crew/conductors")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "crew.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Conductor Roster & Profile — TransitOS" },
      { name: "description", content: "Conductor rosters, ticketing machine registers and availability." },
    ],
  }),
  component: ConductorsPage,
});

// Helpers
function formatMinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToMinutes(time: string): number {
  if (!time) return 330;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h || 0) || isNaN(m || 0)) return 330;
  return (h || 0) * 60 + (m || 0);
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "on-duty":
      return "bg-primary/10 text-primary border-primary/30";
    case "resting":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "leave":
      return "bg-destructive/10 text-destructive border-destructive/30";
    case "unavailable":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

function ConductorsPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog / Sheet states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Selected conductor
  const [selectedConductorId, setSelectedConductorId] = useState<string | null>(null);

  // Form states
  const [formEmpId, setFormEmpId] = useState("");
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("available");
  const [formDepot, setFormDepot] = useState("Salem Central Depot");
  const [formAvailableFrom, setFormAvailableFrom] = useState("05:30");
  const [formRestUntil, setFormRestUntil] = useState("05:30");

  // 1. Fetch Conductors
  const { data: conductorsList = [], isLoading } = useQuery({
    queryKey: ["conductors", statusFilter, depotFilter, search],
    queryFn: () =>
      getConductors({
        status: statusFilter,
        depot: depotFilter,
        search,
      }),
  });

  // 2. Fetch Selected Conductor details
  const { data: selectedConductorDetails } = useQuery({
    queryKey: ["crew-member", selectedConductorId],
    queryFn: () => getCrewMember(selectedConductorId!),
    enabled: !!selectedConductorId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Conductor created successfully");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create conductor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      if (selectedConductorId) {
        queryClient.invalidateQueries({ queryKey: ["crew-member", selectedConductorId] });
      }
      toast.success("Conductor updated successfully");
      setIsEditOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update conductor");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conductors"] });
      queryClient.invalidateQueries({ queryKey: ["crew-availability"] });
      toast.success("Conductor status updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const resetForm = () => {
    setFormEmpId("");
    setFormName("");
    setFormStatus("available");
    setFormDepot("Salem Central Depot");
    setFormAvailableFrom("05:30");
    setFormRestUntil("05:30");
  };

  const handleOpenEdit = (conductor: any) => {
    setSelectedConductorId(conductor.id);
    setFormEmpId(conductor.employeeId);
    setFormName(conductor.name);
    setFormStatus(conductor.status);
    setFormDepot(conductor.depot);
    setFormAvailableFrom(formatMinutesToTime(conductor.availableFrom));
    setFormRestUntil(formatMinutesToTime(conductor.restUntil));
    setIsEditOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedConductorId(id);
    setIsDetailsOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId: formEmpId,
      name: formName,
      role: "conductor",
      status: formStatus,
      depot: formDepot,
      availableFrom: parseTimeToMinutes(formAvailableFrom),
      restUntil: parseTimeToMinutes(formRestUntil),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConductorId) return;
    updateMutation.mutate({
      id: selectedConductorId,
      data: {
        employeeId: formEmpId,
        name: formName,
        status: formStatus,
        depot: formDepot,
        availableFrom: parseTimeToMinutes(formAvailableFrom),
        restUntil: parseTimeToMinutes(formRestUntil),
      },
    });
  };

  const totalCount = conductorsList.length;
  const availableCount = conductorsList.filter((c) => c.status === "available").length;
  const onDutyCount = conductorsList.filter((c) => c.status === "on-duty").length;
  const restingCount = conductorsList.filter((c) => c.status === "resting").length;
  const leaveCount = conductorsList.filter((c) => c.status === "leave").length;

  return (
    <AppShell
      title="Conductor Roster & Registry"
      subtitle="Ticketing crew registry, electronic ticketing machine assignments and shift availability."
      actions={
        canManage ? (
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 text-xs hover:scale-[1.02] transition-all"
          >
            <Plus className="mr-1.5 size-4" />
            Add Conductor
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {/* 1. METRICS OVERVIEW */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          <div className="glass-card p-4 rounded-xl border flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Conductors</span>
            <span className="text-2xl font-bold font-mono mt-1 text-foreground">{totalCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-success flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available</span>
            <span className="text-2xl font-bold font-mono mt-1 text-success">{availableCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-primary flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">On Active Duty</span>
            <span className="text-2xl font-bold font-mono mt-1 text-primary">{onDutyCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-warning flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Resting</span>
            <span className="text-2xl font-bold font-mono mt-1 text-warning">{restingCount}</span>
          </div>
          <div className="glass-card p-4 rounded-xl border-l-4 border-l-destructive flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">On Leave</span>
            <span className="text-2xl font-bold font-mono mt-1 text-destructive">{leaveCount}</span>
          </div>
        </div>

        {/* 2. FILTER BAR */}
        <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-1 flex-wrap gap-3 items-center min-w-[280px]">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conductor name or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-background/60 text-xs border-border/80"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground shrink-0" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 bg-background/60 text-xs border-border/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on-duty">On Duty</SelectItem>
                  <SelectItem value="resting">Resting</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-44 bg-background/60 text-xs border-border/80">
                  <SelectValue placeholder="Depot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  <SelectItem value="Meyyanur Depot">Meyyanur Depot</SelectItem>
                  <SelectItem value="Johnsonpet Depot">Johnsonpet Depot</SelectItem>
                  <SelectItem value="Hasthampatti Depot">Hasthampatti Depot</SelectItem>
                  <SelectItem value="Steel Plant Depot">Steel Plant Depot</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 3. CONDUCTORS TABLE */}
        <div className="glass-panel overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading conductor registry...</div>
          ) : conductorsList.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No conductors found matching current search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60">
                  <TableHead className="w-32 text-xs font-bold">Emp ID</TableHead>
                  <TableHead className="text-xs font-bold">Conductor Name</TableHead>
                  <TableHead className="text-xs font-bold">Depot Location</TableHead>
                  <TableHead className="text-xs font-bold">ETM Terminal</TableHead>
                  <TableHead className="text-xs font-bold">Status</TableHead>
                  <TableHead className="text-xs font-bold">Availability Window</TableHead>
                  <TableHead className="w-28 text-right text-xs font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conductorsList.map((conductor) => (
                  <TableRow key={conductor.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-semibold text-primary font-mono text-xs">{conductor.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px] font-bold bg-warning/10 text-warning">
                            {conductor.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-foreground">{conductor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{conductor.depot}</TableCell>
                    <TableCell className="text-xs font-mono">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Ticket className="size-3 text-warning" />
                        ETM-{conductor.employeeId.slice(-3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={conductor.status}
                          onValueChange={(val) =>
                            statusMutation.mutate({ id: conductor.id, status: val })
                          }
                        >
                          <SelectTrigger className={cn("h-7 w-28 text-[10px] font-semibold uppercase tracking-wider border", getStatusBadgeClass(conductor.status))}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available" className="text-xs uppercase text-emerald-600">Available</SelectItem>
                            <SelectItem value="on-duty" className="text-xs uppercase text-primary">On Duty</SelectItem>
                            <SelectItem value="resting" className="text-xs uppercase text-amber-600">Resting</SelectItem>
                            <SelectItem value="leave" className="text-xs uppercase text-destructive">Leave</SelectItem>
                            <SelectItem value="unavailable" className="text-xs uppercase text-muted-foreground">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={cn("text-[9px] font-semibold uppercase font-mono", getStatusBadgeClass(conductor.status))}>
                          {conductor.status.replace("-", " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {conductor.status === "resting" ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono font-medium text-[11px]">
                          <Clock className="size-3" />
                          Rest ends {formatMinutesToTime(conductor.restUntil)}
                        </span>
                      ) : conductor.status === "available" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">Ready (from {formatMinutesToTime(conductor.availableFrom)})</span>
                      ) : conductor.status === "on-duty" ? (
                        <span className="text-primary font-medium text-[11px]">On Active Route</span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Off Shift</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary rounded-lg"
                          onClick={() => handleOpenDetails(conductor.id)}
                        >
                          <Eye className="size-3.5" />
                          <span className="sr-only">View details</span>
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground rounded-lg"
                            onClick={() => handleOpenEdit(conductor)}
                          >
                            <Edit2 className="size-3.5" />
                            <span className="sr-only">Edit conductor</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* CONDUCTOR PROFILE CARD SHEET */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="sm:max-w-[480px] p-6 overflow-y-auto">
          <SheetHeader className="border-b border-border/60 pb-4">
            <SheetTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <IdCard className="size-5 text-warning" />
              Conductor Profile Card
            </SheetTitle>
          </SheetHeader>

          {selectedConductorDetails ? (
            <div className="mt-5 space-y-6">
              {/* Profile Header Avatar Card */}
              <div className="p-4 rounded-2xl border border-warning/20 bg-gradient-to-br from-warning/10 via-card to-card space-y-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <Avatar className="size-14 ring-2 ring-warning/30 shadow-md">
                    <AvatarFallback className="text-base font-bold bg-warning text-warning-foreground">
                      {selectedConductorDetails.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-base font-bold text-foreground">{selectedConductorDetails.name}</h3>
                    <p className="font-mono text-xs text-warning font-semibold">{selectedConductorDetails.employeeId}</p>
                    <Badge variant="outline" className={cn("mt-1 text-[9px] font-mono uppercase font-bold", getStatusBadgeClass(selectedConductorDetails.status))}>
                      {selectedConductorDetails.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 font-mono">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Depot Base</span>
                    <p className="font-medium text-foreground text-[11px] truncate">{selectedConductorDetails.depot}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Ticketing ETM</span>
                    <p className="font-medium text-foreground text-[11px] truncate">ETM-{selectedConductorDetails.employeeId.slice(-3)}</p>
                  </div>
                </div>
              </div>

              {/* Roster & Availability Telemetry */}
              <div className="glass-panel p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-success" />
                  Shift & Rest Compliance
                </h4>

                <div className="p-2.5 rounded-lg border border-border/60 bg-secondary/20 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available From:</span>
                    <span className="font-mono font-bold">{formatMinutesToTime(selectedConductorDetails.availableFrom)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rest Limit:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatMinutesToTime(selectedConductorDetails.restUntil)}</span>
                  </div>
                </div>
              </div>

              {/* Today's Rostered Duty */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-warning" />
                  Today's Corridor Assignment
                </h4>
                <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-secondary/10">
                  <CheckCircle2 className="size-6 text-emerald-500/60 mx-auto mb-1" />
                  Roster wave active. ETM device verified and checked out for Salem bus operations.
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-xs">
              Loading conductor profile...
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CREATE CONDUCTOR MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Users className="size-4 text-warning" />
                Register New Conductor
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Add an ETM ticketing staff member to the Salem depot registry.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee ID</Label>
                  <Input
                    type="text"
                    placeholder="e.g. EMP-CD-013"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Conductor Full Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Ramesh Babu"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Shift Starts At</Label>
                  <Input
                    type="time"
                    value={formAvailableFrom}
                    onChange={(e) => setFormAvailableFrom(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Initial Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger className="text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="on-duty">On Duty</SelectItem>
                      <SelectItem value="resting">Resting</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-primary text-primary-foreground text-xs font-semibold">
                {createMutation.isPending ? "Creating..." : "Save Conductor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CONDUCTOR MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit2 className="size-4 text-primary" />
                Edit Conductor Information
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employee ID</Label>
                  <Input
                    type="text"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Conductor Full Name</Label>
                  <Input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-duty">On Duty</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending} className="bg-primary text-primary-foreground text-xs font-semibold">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
