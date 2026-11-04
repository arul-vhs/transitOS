import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Ticket,
  UserCheck,
  Upload,
  Download,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useActiveTenant } from "@/lib/tenant-context";
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
import { Route as RootRoute } from "@/routes/__root";
import { hasPermission } from "@/lib/auth-shared";
import {
  getCrewRoster,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  updateCrewStatus,
  bulkImportCrew,
} from "@/lib/fleet-crew";
import { formatMinutesTo12Hour } from "@/lib/date-time-utils";

export const Route = createFileRoute("/crew/drivers")({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Bus Crew: TransitOS" },
      {
        name: "description",
        content:
          "Bus crew roster, depot allocation, driver and conductor availability status, and trip assignments.",
      },
    ],
  }),
  component: BusCrewPage,
});

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "available":
      return "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "assigned":
      return "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10";
    case "resting":
      return "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10";
    case "leave":
      return "border-muted-foreground/30 text-muted-foreground bg-muted/20";
    case "inactive":
    case "unavailable":
      return "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10";
    default:
      return "border-border text-muted-foreground bg-muted/20";
  }
}

interface AssignedTripInfo {
  tripId: string;
  tripCode: string;
  routeCode: string;
  origin: string;
  destination: string;
  departureTime: number;
  dutyCode: string;
}

interface CrewItem {
  id: string;
  name: string;
  employeeId: string;
  role: "driver" | "conductor";
  depot: string;
  status: string;
  licenseCategory?: string | null;
  assignedTrip?: AssignedTripInfo | null;
}

function BusCrewPage() {
  const queryClient = useQueryClient();
  const context = RootRoute.useRouteContext();
  const user = context?.user;
  const canManage = hasPermission(user?.role || "", "crew.manage");
  const { currentTenant } = useActiveTenant();

  // Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [depotFilter, setDepotFilter] = useState("all");

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<CrewItem | null>(null);

  // Form values
  const [formName, setFormName] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formRole, setFormRole] = useState<"driver" | "conductor">("driver");
  const [formDepot, setFormDepot] = useState(
    currentTenant?.depots?.[0]?.name || "Central / Broadway Depot",
  );
  const [formStatus, setFormStatus] = useState("available");
  const [formLicense, setFormLicense] = useState(
    "Heavy Passenger Vehicle (HPV) / PSV Badge",
  );

  // CSV Import state
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<
    Array<{
      employeeId: string;
      name: string;
      role: "driver" | "conductor";
      depot: string;
      status: string;
      licenseCategory?: string;
      error?: string;
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);

  // Query Crew Roster
  const {
    data: crewList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<CrewItem[]>({
    queryKey: [
      "crew-roster",
      currentTenant.id,
      roleFilter,
      statusFilter,
      depotFilter,
      search,
    ],
    queryFn: () =>
      getCrewRoster({
        role: roleFilter,
        status: statusFilter,
        depot: depotFilter,
        search,
      }) as Promise<CrewItem[]>,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-roster"] });
      toast.success("Crew member registered successfully.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register crew member.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCrewMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-roster"] });
      toast.success("Crew profile updated.");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update crew profile.");
    },
  });

  const [memberToDelete, setMemberToDelete] = useState<CrewItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCrewMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-roster"] });
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Driver removed successfully.");
      setMemberToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete driver.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateCrewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew-roster"] });
      toast.success("Availability status updated.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update availability status.");
    },
  });

  const resetForm = () => {
    setEditingCrewId(null);
    setFormName("");
    setFormEmployeeId("");
    setFormRole("driver");
    setFormDepot(currentTenant?.depots?.[0]?.name || "Central / Broadway Depot");
    setFormStatus("available");
    setFormLicense("Heavy Passenger Vehicle (HPV) / PSV Badge");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: CrewItem) => {
    setEditingCrewId(member.id);
    setFormName(member.name);
    setFormEmployeeId(member.employeeId);
    setFormRole(member.role);
    setFormDepot(member.depot);
    setFormStatus(member.status);
    setFormLicense(member.licenseCategory || "");
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Employee name is required.");
      return;
    }

    if (editingCrewId) {
      updateMutation.mutate({
        id: editingCrewId,
        data: {
          name: formName.trim(),
          employeeId: formEmployeeId.trim(),
          depot: formDepot,
          status: formStatus,
          licenseCategory: formRole === "driver" ? formLicense : null,
        },
      });
    } else {
      const generatedId =
        formEmployeeId.trim() ||
        (formRole === "driver"
          ? `EMP-DRV-${Math.floor(100 + Math.random() * 900)}`
          : `EMP-CND-${Math.floor(200 + Math.random() * 800)}`);

      createMutation.mutate({
        name: formName.trim(),
        employeeId: generatedId,
        role: formRole,
        depot: formDepot,
        status: formStatus,
        licenseCategory: formRole === "driver" ? formLicense : null,
      });
    }
  };

  // CSV parsing logic
  const handleParseCsv = (text: string) => {
    setCsvText(text);
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    // Skip header line
    const rows: typeof parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 2) continue;

      const employeeId = parts[0] || "";
      const name = parts[1] || "";
      const rawRole = (parts[2] || "").toLowerCase();
      const role: "driver" | "conductor" =
        rawRole.includes("cond") ? "conductor" : "driver";
      const depot = parts[3] || currentTenant?.depots?.[0]?.name || "Central / Broadway Depot";
      const status = parts[4] || "available";
      const licenseCategory = parts[5] || (role === "driver" ? "Heavy Passenger Vehicle (HPV)" : "");

      let errorMsg: string | undefined;
      if (!employeeId) errorMsg = "Missing Employee ID";
      else if (!name) errorMsg = "Missing Name";

      rows.push({
        employeeId,
        name,
        role,
        depot,
        status,
        licenseCategory,
        error: errorMsg,
      });
    }
    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedRows.filter((r) => !r.error);
    if (validRows.length === 0) {
      toast.error("No valid crew records to import.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await bulkImportCrew({
        members: validRows.map((r) => ({
          employeeId: r.employeeId,
          name: r.name,
          role: r.role,
          depot: r.depot,
          status: r.status,
          licenseCategory: r.licenseCategory,
        })),
      });

      if (res.success) {
        toast.success(
          `Successfully imported ${res.insertedCount} crew members.${res.skippedCount > 0 ? ` (${res.skippedCount} duplicates skipped)` : ""}`,
        );
        queryClient.invalidateQueries({ queryKey: ["crew-roster"] });
        setIsImportOpen(false);
        setCsvText("");
        setParsedRows([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk import failed.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const defaultDepot =
      currentTenant?.depots?.[0]?.name || "Central / Broadway Depot";
    const csvContent = [
      "Employee ID,Name,Role,Depot,Status,License Category",
      `EMP-DRV-901,K. Venkatesh,driver,${defaultDepot},available,Heavy Passenger Vehicle (HPV)`,
      `EMP-CND-902,M. Soundararajan,conductor,${defaultDepot},available,Certified Conductor Badge`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `crew_roster_template_${currentTenant.slug || "transit"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV template downloaded.");
  };

  // Metrics
  const totalCrew = crewList.length;
  const availableCount = crewList.filter((c) => c.status === "available").length;
  const assignedCount = crewList.filter(
    (c) => c.status === "assigned" || c.assignedTrip != null,
  ).length;
  const offDutyCount = crewList.filter(
    (c) =>
      c.status === "resting" ||
      c.status === "leave" ||
      c.status === "inactive" ||
      c.status === "unavailable",
  ).length;

  const depotOptions = [
    { label: "All Depots", value: "all" },
    ...(currentTenant?.depots || []).map((d: any) => ({
      label: d.name,
      value: d.name,
    })),
  ];

  return (
    <AppShell
      title="Bus Crew"
      subtitle={`Certified drivers and conductors, operating depot allocations, and trip assignments for ${currentTenant.name}.`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
            className="text-xs rounded-md border-border hover:bg-muted font-medium"
          >
            <Download className="mr-1.5 size-3.5" />
            CSV Template
          </Button>

          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedRows([]);
                  setCsvText("");
                  setIsImportOpen(true);
                }}
                className="text-xs rounded-md border-border hover:bg-muted font-medium"
              >
                <Upload className="mr-1.5 size-3.5" />
                Bulk CSV Import
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
              >
                <Plus className="mr-1.5 size-3.5" />
                Add Crew Member
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Error Alert if query failed */}
        {isError && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Unable to load crew roster
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(error as Error)?.message ||
                    "An unexpected error occurred while communicating with the crew database."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs rounded-md border-rose-500/30 hover:bg-rose-500/20 text-rose-600 shrink-0"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry Query
            </Button>
          </div>
        )}

        {/* 4-KPI Metric Grid */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Crew Members
              </span>
              <Users className="size-4 text-primary" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-foreground">
              {isLoading ? "..." : totalCrew}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {currentTenant.name}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Available for Duty
              </span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : availableCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Ready for dispatch</p>
          </div>

          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Assigned to Trips
              </span>
              <Clock className="size-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-blue-600 dark:text-blue-400">
              {isLoading ? "..." : assignedCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Active in scheduled duties</p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Off-Duty / Leave / Inactive
              </span>
              <AlertTriangle className="size-4 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight mt-1 text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : offDutyCount}
            </p>
            <p className="text-[11px] text-muted-foreground">Mandatory rest or leave</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-lg border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, employee ID, or depot..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9 rounded-md bg-background"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] text-xs h-9 rounded-md bg-background">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="driver">Drivers Only</SelectItem>
                  <SelectItem value="conductor">Conductors Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Availability Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] text-xs h-9 rounded-md bg-background">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="resting">Resting</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Depot Filter */}
              <Select value={depotFilter} onValueChange={setDepotFilter}>
                <SelectTrigger className="w-[200px] text-xs h-9 rounded-md bg-background">
                  <SelectValue placeholder="All Depots" />
                </SelectTrigger>
                <SelectContent>
                  {depotOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {crewList.length} staff records
            </span>
          </div>
        </div>

        {/* Bus Crew Interface Table */}
        <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold py-3">Employee</TableHead>
                <TableHead className="text-xs font-semibold py-3">Role</TableHead>
                <TableHead className="text-xs font-semibold py-3">Depot</TableHead>
                <TableHead className="text-xs font-semibold py-3">Availability</TableHead>
                <TableHead className="text-xs font-semibold py-3">Assigned Trip</TableHead>
                <TableHead className="text-xs font-semibold py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="py-4 text-center">
                      <div className="h-4 bg-muted/60 animate-pulse rounded max-w-md mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : crewList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Users className="size-6" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground">
                        No crew records found
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        No registered drivers or conductors match your selected filters for{" "}
                        <span className="font-semibold text-foreground">
                          {currentTenant.name}
                        </span>
                        . Add a staff member or import a CSV roster to get started.
                      </p>
                      {canManage && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={handleOpenCreate}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
                          >
                            <Plus className="mr-1.5 size-3.5" />
                            Add Crew Member
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setParsedRows([]);
                              setCsvText("");
                              setIsImportOpen(true);
                            }}
                            className="text-xs rounded-md border-border hover:bg-muted font-medium"
                          >
                            <Upload className="mr-1.5 size-3.5" />
                            Import CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                crewList.map((member) => (
                  <TableRow
                    key={member.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* 1. Employee */}
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {member.employeeId}
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {member.name}
                          </span>
                        </div>
                        {member.licenseCategory && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="size-3 text-muted-foreground shrink-0" />
                            {member.licenseCategory}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 2. Role */}
                    <TableCell className="py-3">
                      {member.role === "driver" ? (
                        <Badge
                          variant="outline"
                          className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-medium rounded-md px-2 py-0.5"
                        >
                          <UserCheck className="mr-1 size-3 shrink-0" />
                          Driver
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium rounded-md px-2 py-0.5"
                        >
                          <Ticket className="mr-1 size-3 shrink-0" />
                          Conductor
                        </Badge>
                      )}
                    </TableCell>

                    {/* 3. Depot */}
                    <TableCell className="py-3">
                      <span className="text-xs font-medium text-foreground">
                        {member.depot}
                      </span>
                    </TableCell>

                    {/* 4. Availability */}
                    <TableCell className="py-3">
                      {canManage ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={member.status}
                            onValueChange={(val) =>
                              statusMutation.mutate({ id: member.id, status: val })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-[125px] text-[11px] rounded-md font-medium ${getStatusBadgeClass(member.status)}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="resting">Resting</SelectItem>
                              <SelectItem value="leave">On Leave</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`text-[11px] rounded-md ${getStatusBadgeClass(member.status)}`}
                        >
                          {member.status}
                        </Badge>
                      )}
                    </TableCell>

                    {/* 5. Assigned Trip */}
                    <TableCell className="py-3">
                      {member.assignedTrip ? (
                        <div
                          onClick={() => setViewingAssignment(member)}
                          className="group flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-mono text-xs font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-md shrink-0">
                            {member.assignedTrip.routeCode}
                          </span>
                          <div className="flex flex-col min-w-0 max-w-[220px]">
                            <span className="text-xs font-medium text-foreground truncate">
                              {member.assignedTrip.origin} → {member.assignedTrip.destination}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              Dep: {formatMinutesTo12Hour(member.assignedTrip.departureTime)} | {member.assignedTrip.tripCode}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground text-[10px] rounded-md bg-muted/20 font-normal"
                        >
                          Unassigned
                        </Badge>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {member.assignedTrip && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingAssignment(member)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
                            title="View Duty Assignment"
                          >
                            <Eye className="size-3.5 mr-1" />
                            View
                          </Button>
                        )}

                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(member)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
                            >
                              <Edit2 className="size-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMemberToDelete(member)}
                              className="h-7 px-2 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-500/10 rounded-md"
                              title="Delete Driver"
                            >
                              <Trash2 className="size-3.5 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Crew Member Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingCrewId ? "Edit Crew Profile" : "Register New Crew Member"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingCrewId
                ? "Update staff contact details, operating depot, and active availability status."
                : "Add a driver or conductor to the operating transport roster."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Role</Label>
                <Select
                  value={formRole}
                  onValueChange={(val: "driver" | "conductor") => setFormRole(val)}
                  disabled={editingCrewId != null}
                >
                  <SelectTrigger className="text-xs h-9 rounded-md bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="conductor">Conductor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Employee ID</Label>
                <Input
                  placeholder={formRole === "driver" ? "EMP-DRV-101" : "EMP-CND-201"}
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="text-xs h-9 rounded-md font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Full Name</Label>
              <Input
                placeholder="e.g. R. Murugan"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="text-xs h-9 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Reporting Depot</Label>
                <Select value={formDepot} onValueChange={setFormDepot}>
                  <SelectTrigger className="text-xs h-9 rounded-md bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(currentTenant?.depots || []).map((d: any) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Availability Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="text-xs h-9 rounded-md bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="resting">Resting</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formRole === "driver" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">License Category</Label>
                <Input
                  placeholder="Heavy Passenger Vehicle (HPV) / PSV Badge"
                  value={formLicense}
                  onChange={(e) => setFormLicense(e.target.value)}
                  className="text-xs h-9 rounded-md"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
              >
                {editingCrewId ? "Save Changes" : "Register Crew Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-primary" />
              Bulk CSV Crew Import
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload a CSV file containing staff records. Duplicates will be validated
              against existing roster identifiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="border border-dashed border-border hover:border-primary/50 rounded-lg p-4 text-center bg-muted/20 transition-colors">
                  <Upload className="size-6 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-foreground">
                    Click to browse and upload CSV file
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Expected format: Employee ID, Name, Role, Depot, Status, License
                  </p>
                </div>
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs rounded-md border-border hover:bg-muted font-medium shrink-0"
              >
                <Download className="mr-1.5 size-3.5" />
                Template
              </Button>
            </div>

            {/* Paste CSV raw text */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Or paste CSV text directly</Label>
              <textarea
                value={csvText}
                onChange={(e) => handleParseCsv(e.target.value)}
                placeholder={"Employee ID,Name,Role,Depot,Status,License\nEMP-DRV-901,K. Venkatesh,driver,Central / Broadway Depot,available,Heavy Passenger Vehicle"}
                rows={4}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Preview ({parsedRows.length} rows parsed)
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {parsedRows.filter((r) => !r.error).length} valid
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-[11px] py-1.5">ID</TableHead>
                        <TableHead className="text-[11px] py-1.5">Name</TableHead>
                        <TableHead className="text-[11px] py-1.5">Role</TableHead>
                        <TableHead className="text-[11px] py-1.5">Depot</TableHead>
                        <TableHead className="text-[11px] py-1.5">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 20).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="py-1 text-[11px] font-mono">
                            {row.employeeId || "-"}
                          </TableCell>
                          <TableCell className="py-1 text-[11px]">
                            {row.name}
                          </TableCell>
                          <TableCell className="py-1 text-[11px] capitalize">
                            {row.role}
                          </TableCell>
                          <TableCell className="py-1 text-[11px] truncate max-w-[150px]">
                            {row.depot}
                          </TableCell>
                          <TableCell className="py-1 text-[11px]">
                            {row.error ? (
                              <span className="text-rose-500 font-semibold">
                                {row.error}
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-medium">Valid</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(false)}
              className="text-xs rounded-md"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isImporting || parsedRows.filter((r) => !r.error).length === 0}
              onClick={handleConfirmImport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs cursor-pointer"
            >
              {isImporting
                ? "Importing..."
                : `Confirm & Import (${parsedRows.filter((r) => !r.error).length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Assignment Dialog */}
      <Dialog
        open={viewingAssignment != null}
        onOpenChange={(open) => !open && setViewingAssignment(null)}
      >
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              Active Assignment Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Current operational duty and scheduled trip for this staff member.
            </DialogDescription>
          </DialogHeader>

          {viewingAssignment && viewingAssignment.assignedTrip && (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Assigned Staff
                  </span>
                  <Badge
                    variant="outline"
                    className="border-blue-500/30 text-blue-600 capitalize text-xs rounded-md"
                  >
                    {viewingAssignment.role}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {viewingAssignment.name}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    ({viewingAssignment.employeeId})
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Depot: {viewingAssignment.depot}
                </p>
              </div>

              <div className="rounded-lg border border-border/80 bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Trip Corridor
                  </span>
                  <span className="font-mono text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-md">
                    {viewingAssignment.assignedTrip.routeCode}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-foreground pt-1">
                  <MapPin className="size-3.5 text-blue-600 shrink-0" />
                  <span>{viewingAssignment.assignedTrip.origin}</span>
                  <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  <span>{viewingAssignment.assignedTrip.destination}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Departure:</span>
                    <p className="font-mono font-bold text-foreground">
                      {formatMinutesTo12Hour(viewingAssignment.assignedTrip.departureTime)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Duty Code:</span>
                    <p className="font-mono font-bold text-foreground">
                      {viewingAssignment.assignedTrip.dutyCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewingAssignment(null)}
              className="text-xs rounded-md"
            >
              Close
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs"
            >
              <Link to="/operations/trips">
                <span>Go to Timetable</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
        {/* Delete Driver Confirmation Dialog */}
        <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Driver Removal</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to remove driver{" "}
                <span className="font-semibold text-foreground">{memberToDelete?.name} ({memberToDelete?.employeeId})</span> from active depot roster? This will archive their duty record.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToDelete(null)}
                disabled={deleteMutation.isPending}
                className="text-xs rounded-md"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => memberToDelete && deleteMutation.mutate(memberToDelete.id)}
                disabled={deleteMutation.isPending}
                className="text-xs rounded-md"
              >
                {deleteMutation.isPending ? "Removing..." : "Remove Driver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Dialog>
    </AppShell>
  );
}
