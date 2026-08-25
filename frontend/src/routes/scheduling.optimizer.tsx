import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bus as BusIcon,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  Sparkles,
  UserX,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BUSES,
  CONDUCTORS,
  CONSTRAINTS,
  DEPOT,
  DRIVERS,
  SCHEDULE_DATE,
  busLabel,
  crewLabel,
  fmtTime,
  routeLabel,
} from "@/lib/transit/data";
import {
  createIncident,
  detectConflicts,
  generateSchedule,
  rescheduleAffectedDuties,
  validateSchedule,
} from "@/lib/transit/engine";
import type {
  Duty,
  DutyType,
  Incident,
  RescheduleAction,
  RescheduleResult,
  Schedule,
} from "@/lib/transit/types";
import { cn } from "@/lib/utils";

import { hasPermission } from "@/lib/auth-shared";

export const Route = createFileRoute("/scheduling/optimizer")({
  beforeLoad: ({ context }) => {
    if (!context.user || !hasPermission(context.user.role, "schedule.view")) {
      throw new Error("Forbidden");
    }
  },
  head: () => ({
    meta: [
      { title: "Schedule Optimizer — TransitOS" },
      {
        name: "description",
        content:
          "Generate, validate and dynamically reschedule bus and crew duties for Salem Central Depot.",
      },
      { property: "og:title", content: "Schedule Optimizer — TransitOS" },
      {
        property: "og:description",
        content: "Constraint-based automatic scheduling with minimum-disruption rescheduling.",
      },
    ],
  }),
  component: OptimizerPage,
});

const GEN_STEPS = [
  "Loading trips...",
  "Checking bus availability...",
  "Checking crew availability...",
  "Applying scheduling constraints...",
  "Optimizing duties...",
  "Generating schedule...",
];

const RESCHEDULE_STEPS = [
  "Checking available buses...",
  "Checking crew availability...",
  "Checking rest constraints...",
  "Checking turnaround time...",
  "Finding minimum-disruption solution...",
];

function useStepRunner() {
  const [steps, setSteps] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const run = async (list: string[], onDone: () => void) => {
    setRunning(true);
    setSteps([]);
    for (const step of list) {
      setSteps((s) => [...s, step]);
      await new Promise((r) => setTimeout(r, 320));
    }
    setRunning(false);
    onDone();
  };

  return { steps, running, run, reset: () => setSteps([]) };
}

function Kpi({
  label,
  value,
  tone = "default",
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "danger" | "success";
  hint?: string;
  icon: typeof BusIcon;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon
          className={cn(
            "size-4",
            tone === "danger" ? "text-destructive" : "text-muted-foreground",
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 font-mono text-3xl font-semibold tabular-nums",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: Duty["status"] }) {
  const map: Record<Duty["status"], { label: string; cls: string }> = {
    valid: { label: "Valid", cls: "bg-success/12 text-success border-success/25" },
    conflict: {
      label: "Conflict",
      cls: "bg-destructive/10 text-destructive border-destructive/25",
    },
    affected: { label: "Affected", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
    rescheduled: { label: "Rescheduled", cls: "bg-info/12 text-info border-info/25" },
  };
  const item = map[status];
  return (
    <Badge variant="outline" className={cn("font-medium", item.cls)}>
      {item.label}
    </Badge>
  );
}

function OptimizerPage() {
  const [dutyType, setDutyType] = useState<DutyType>("linked");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [baseline, setBaseline] = useState<Schedule | null>(null);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [result, setResult] = useState<RescheduleResult | null>(null);
  const [explain, setExplain] = useState<RescheduleAction | null>(null);
  const [selectedBus, setSelectedBus] = useState<string>("B001");
  const gen = useStepRunner();
  const fix = useStepRunner();

  const duties = schedule?.duties ?? [];
  const conflicts = useMemo(() => detectConflicts(duties), [duties]);
  const checks = useMemo(() => validateSchedule(duties), [duties]);

  const affectedIds = new Set(incident?.affectedDutyIds ?? []);
  const busesInUse = new Set(duties.map((d) => d.busId));
  const crewInUse = new Set(duties.flatMap((d) => [d.driverId, d.conductorId]));
  const availableBuses = BUSES.length - busesInUse.size;
  const availableCrew = DRIVERS.length + CONDUCTORS.length - crewInUse.size;

  const handleGenerate = () => {
    setIncident(null);
    setResult(null);
    setBaseline(null);
    setSchedule(null);
    fix.reset();
    void gen.run(GEN_STEPS, () => {
      const s = generateSchedule(dutyType);
      setSchedule(s);
      setBaseline(s);
      toast.success("Schedule generated successfully", {
        description: `${s.duties.length} duties · 0 conflicts · ${dutyType === "linked" ? "Linked" : "Unlinked"} duty`,
      });
    });
  };

  const handleIncident = (kind: Incident["kind"]) => {
    if (!schedule) return;
    const inc = createIncident(kind, baseline ?? schedule);
    if (!inc) {
      toast.error("No duties affected by this incident");
      return;
    }
    const base = baseline ?? schedule;
    setBaseline(base);
    setResult(null);
    fix.reset();
    setIncident(inc);
    setSchedule({
      ...base,
      duties: base.duties.map((d) =>
        inc.affectedDutyIds.includes(d.id) ? { ...d, status: "affected" as const } : d,
      ),
    });
    toast.warning(
      kind === "bus-breakdown"
        ? `Bus ${inc.resourceLabel} has broken down at ${fmtTime(inc.time)}.`
        : `Driver ${inc.resourceLabel} is unavailable from ${fmtTime(inc.time)}.`,
      { description: `${inc.affectedDutyIds.length} duties affected` },
    );
  };

  const handleAnalyze = () => {
    if (!incident || !baseline) return;
    void fix.run(RESCHEDULE_STEPS, () => {
      const res = rescheduleAffectedDuties(baseline, incident);
      setResult(res);
      setSchedule(res.schedule);
      toast.success("Dynamic rescheduling completed successfully.", {
        description: `${res.retainedPercent}% of the original schedule retained`,
      });
    });
  };

  const busDuties = duties
    .filter((d) => d.busId === selectedBus)
    .sort((a, b) => a.startTime - b.startTime);

  return (
    <AppShell
      title="Schedule Optimizer"
      subtitle="Generate, validate and dynamically reschedule bus and crew duties."
      actions={
        <div className="hidden items-center gap-2 md:flex">
          {["AUTOMATED", "INTELLIGENT", "DYNAMIC"].map((t) => (
            <Badge key={t} variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              {t}
            </Badge>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="panel flex flex-wrap items-end gap-4 p-4">
          <Field label="Date">
            <Select defaultValue={SCHEDULE_DATE}>
              <SelectTrigger className="w-[168px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SCHEDULE_DATE}>{SCHEDULE_DATE}</SelectItem>
                <SelectItem value="15 Aug 2026">15 Aug 2026</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Depot">
            <Select defaultValue={DEPOT}>
              <SelectTrigger className="w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEPOT}>{DEPOT}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Duty Type">
            <Select value={dutyType} onValueChange={(v) => setDutyType(v as DutyType)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linked">Linked Duty</SelectItem>
                <SelectItem value="unlinked">Unlinked Duty</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Button onClick={handleGenerate} disabled={gen.running} className="ml-auto">
            {gen.running ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate Schedule
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Available Buses"
            value={schedule ? Math.max(availableBuses, 0) : BUSES.length}
            hint={`${BUSES.length} in fleet · ${busesInUse.size} on duty`}
            icon={BusIcon}
          />
          <Kpi
            label="Available Crew"
            value={schedule ? availableCrew : DRIVERS.length + CONDUCTORS.length}
            hint={`${DRIVERS.length} drivers · ${CONDUCTORS.length} conductors`}
            icon={Users}
          />
          <Kpi
            label="Trips"
            value={36}
            hint={`${duties.length} duties scheduled`}
            icon={ArrowRight}
          />
          <Kpi
            label="Conflicts"
            value={conflicts.length}
            tone={conflicts.length ? "danger" : "success"}
            hint={conflicts.length ? "Constraint violation detected" : "All constraints satisfied"}
            icon={CircleAlert}
          />
        </div>

        {/* Generation progress / empty state */}
        {gen.running || (!schedule && gen.steps.length > 0) ? (
          <div className="panel space-y-2 p-5">
            {gen.steps.map((s, i) => (
              <p key={s} className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                {i === gen.steps.length - 1 && gen.running ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 className="size-3.5 text-success" />
                )}
                {s}
              </p>
            ))}
          </div>
        ) : null}

        {!schedule && !gen.running ? (
          <div className="panel grid place-items-center p-12 text-center">
            <div className="max-w-md space-y-2">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
                <BusIcon className="size-6" />
              </div>
              <h2 className="text-base font-semibold">No schedule generated yet</h2>
              <p className="text-sm text-muted-foreground">
                Pick a date, depot and duty type, then run the optimizer to build a constraint-feasible
                duty roster for {DEPOT}.
              </p>
            </div>
          </div>
        ) : null}

        {schedule ? (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/8 px-4 py-2.5 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> Schedule generated successfully
            </div>

            {/* Table */}
            <section className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">Generated Duties</h2>
                  <p className="text-xs text-muted-foreground">
                    {schedule.date} · {schedule.depot} ·{" "}
                    {schedule.dutyType === "linked" ? "Linked" : "Unlinked"} duty
                  </p>
                </div>
                <Badge variant="secondary">{duties.length} duties</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Duty</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Conductor</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duties.map((d) => {
                      const action = result?.actions.find((a) => a.dutyId === d.id);
                      return (
                        <TableRow
                          key={d.id}
                          className={cn(
                            affectedIds.has(d.id) && !result && "bg-warning/10",
                            action && "bg-info/6",
                          )}
                        >
                          <TableCell className="font-mono font-medium">{d.id}</TableCell>
                          <TableCell className="font-mono">
                            {action?.field === "bus" ? (
                              <button
                                onClick={() => setExplain(action)}
                                className="text-info underline decoration-dotted underline-offset-4"
                              >
                                {busLabel(d.busId)}
                              </button>
                            ) : (
                              busLabel(d.busId)
                            )}
                          </TableCell>
                          <TableCell>
                            {action?.field === "driver" ? (
                              <button
                                onClick={() => setExplain(action)}
                                className="text-info underline decoration-dotted underline-offset-4"
                              >
                                {crewLabel(d.driverId)}
                              </button>
                            ) : (
                              crewLabel(d.driverId)
                            )}
                          </TableCell>
                          <TableCell>{crewLabel(d.conductorId)}</TableCell>
                          <TableCell>{routeLabel(d.routeId)}</TableCell>
                          <TableCell className="font-mono">{fmtTime(d.startTime)}</TableCell>
                          <TableCell className="font-mono">{fmtTime(d.endTime)}</TableCell>
                          <TableCell>
                            <StatusBadge status={d.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-3">
              {/* Timeline */}
              <section className="panel p-4 xl:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">Linked Duty Timeline</h2>
                    <p className="text-xs text-muted-foreground">
                      In a linked duty the same crew stays with the bus for the whole duty.
                    </p>
                  </div>
                  <Select value={selectedBus} onValueChange={setSelectedBus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSES.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.registrationNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Timeline duties={busDuties} />
              </section>

              {/* Constraints */}
              <section className="panel p-4">
                <h2 className="text-sm font-semibold">Scheduling Constraints</h2>
                <p className="text-xs text-muted-foreground">
                  Max duty {CONSTRAINTS.maxDutyMinutes} min · rest ≥ {CONSTRAINTS.minRestMinutes} min ·
                  turnaround ≥ {CONSTRAINTS.turnaroundMinutes} min
                </p>
                <ul className="mt-3 space-y-2">
                  {checks.map((c) => (
                    <li key={c.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        {c.ok ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : (
                          <AlertTriangle className="size-4 text-destructive" />
                        )}
                        <span className={cn(!c.ok && "font-medium text-destructive")}>{c.label}</span>
                      </div>
                      {!c.ok && c.detail ? (
                        <p className="mt-1 rounded-md border border-destructive/25 bg-destructive/8 px-2 py-1.5 text-xs text-destructive">
                          ⚠ {c.detail}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Incident simulation */}
            <section className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Simulate Operational Incident</h2>
                  <p className="text-xs text-muted-foreground">
                    Inject a real-world disruption and let the engine repair only what breaks.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleIncident("bus-breakdown")}>
                    <BusIcon className="size-4" /> Bus Breakdown
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleIncident("crew-unavailable")}
                  >
                    <UserX className="size-4" /> Crew Unavailable
                  </Button>
                </div>
              </div>

              {incident ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/6 p-4 lg:col-span-1">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-destructive">
                      <AlertTriangle className="size-4" /> Incident detected
                    </p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <Row
                        k={incident.kind === "bus-breakdown" ? "Bus" : "Driver"}
                        v={incident.resourceLabel}
                      />
                      <Row k="Time" v={fmtTime(incident.time)} />
                      <Row k="Location" v={incident.location} />
                      <Separator className="my-2" />
                      <Row k="Affected Trips" v={String(incident.affectedDutyIds.length)} />
                      <Row k="Affected Crew" v={String(incident.affectedCrewCount)} />
                    </dl>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium">Affected Duties</p>
                      {incident.affectedDutyIds.map((id) => (
                        <Badge key={id} variant="outline" className="border-warning/50 bg-warning/15 font-mono">
                          {id}
                        </Badge>
                      ))}
                      <Button
                        size="sm"
                        className="ml-auto"
                        onClick={handleAnalyze}
                        disabled={fix.running || !!result}
                      >
                        {fix.running ? <Loader2 className="size-4 animate-spin" /> : null}
                        Analyze Impact
                      </Button>
                    </div>
                    {fix.steps.length ? (
                      <div className="mt-3 space-y-1.5">
                        {fix.steps.map((s, i) => (
                          <p
                            key={s}
                            className="flex items-center gap-2 font-mono text-sm text-muted-foreground"
                          >
                            {i === fix.steps.length - 1 && fix.running ? (
                              <Loader2 className="size-3.5 animate-spin text-primary" />
                            ) : (
                              <CheckCircle2 className="size-3.5 text-success" />
                            )}
                            {s}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>

            {result && baseline ? (
              <>
                <section className="panel p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <CheckCircle2 className="size-4" /> Dynamic rescheduling completed successfully.
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
                    <div className="rounded-lg border border-border bg-secondary/50 p-4 text-center">
                      <p className="font-mono text-4xl font-semibold text-primary">
                        {result.retainedPercent}%
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        of original schedule retained
                      </p>
                      <Progress value={result.retainedPercent} className="mt-3" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <Metric label="Duties affected" value={result.affectedDuties} />
                      <Metric label="Bus assignments changed" value={result.busChanges} />
                      <Metric label="Crew assignments changed" value={result.crewChanges} />
                      <Metric label="Rest violations" value={result.restViolations} good />
                      <Metric label="Unserved trips" value={result.unservedTrips} good />
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <ComparePanel
                    title="Before Incident"
                    tone="muted"
                    duties={baseline.duties.filter((d) => affectedIds.has(d.id))}
                  />
                  <ComparePanel
                    title="After Rescheduling"
                    tone="info"
                    duties={result.schedule.duties.filter((d) => affectedIds.has(d.id))}
                    actions={result.actions}
                    onExplain={setExplain}
                  />
                </section>
                <p className="text-xs text-muted-foreground">
                  <Info className="mr-1 inline size-3.5" />
                  {baseline.duties.length - result.affectedDuties} unaffected duties were frozen and
                  left untouched — the optimizer repaired only the disrupted duties.
                </p>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <Dialog open={!!explain} onOpenChange={(o) => !o && setExplain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Why was this {explain?.field === "bus" ? "bus" : "crew member"} selected?</DialogTitle>
            <DialogDescription>
              {explain
                ? `${explain.toLabel} replaced ${explain.fromLabel} on duty ${explain.dutyId}.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2">
            {explain?.reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                {r}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function Metric({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p
        className={cn(
          "font-mono text-2xl font-semibold",
          good && value === 0 ? "text-success" : undefined,
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Timeline({ duties }: { duties: Duty[] }) {
  const dayStart = 5 * 60;
  const dayEnd = 20 * 60;
  const span = dayEnd - dayStart;
  const ticks = [6, 8, 10, 12, 14, 16, 18];

  if (!duties.length) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No duties assigned to this bus.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="relative h-20 rounded-lg border border-border bg-secondary/40">
        {ticks.map((h) => (
          <div
            key={h}
            className="absolute top-0 h-full border-l border-dashed border-border/70"
            style={{ left: `${((h * 60 - dayStart) / span) * 100}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 font-mono text-[10px] text-muted-foreground">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}
        {duties.map((d) => (
          <div
            key={d.id}
            className="absolute top-3 flex h-14 flex-col justify-center overflow-hidden rounded-md border border-primary/30 bg-primary/12 px-2 text-[11px] leading-tight"
            style={{
              left: `${((d.startTime - dayStart) / span) * 100}%`,
              width: `${((d.endTime - d.startTime) / span) * 100}%`,
            }}
          >
            <span className="truncate font-semibold text-primary">
              {crewLabel(d.driverId)} + {crewLabel(d.conductorId)}
            </span>
            <span className="truncate text-muted-foreground">{routeLabel(d.routeId)}</span>
            <span className="truncate font-mono text-muted-foreground">
              {fmtTime(d.startTime)}–{fmtTime(d.endTime)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Same crew block remains linked to the bus for the entire duty window.
      </p>
    </div>
  );
}

function ComparePanel({
  title,
  duties,
  tone,
  actions,
  onExplain,
}: {
  title: string;
  duties: Duty[];
  tone: "muted" | "info";
  actions?: RescheduleAction[];
  onExplain?: (a: RescheduleAction) => void;
}) {
  return (
    <div className="panel p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {duties.map((d) => {
          const action = actions?.find((a) => a.dutyId === d.id);
          return (
            <li
              key={d.id}
              className={cn(
                "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 font-mono text-sm",
                tone === "info" && action
                  ? "border-info/30 bg-info/8"
                  : "border-border bg-secondary/40",
              )}
            >
              <span className="font-semibold">{d.id}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className={cn(action?.field === "bus" && "font-semibold text-info")}>
                {busLabel(d.busId)}
              </span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span>{routeLabel(d.routeId)}</span>
              <span className={cn("text-xs", action?.field === "driver" && "font-semibold text-info")}>
                · {crewLabel(d.driverId)}
              </span>
              {action && onExplain ? (
                <button
                  onClick={() => onExplain(action)}
                  className="ml-auto text-xs font-medium text-info underline decoration-dotted underline-offset-4"
                >
                  Why?
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
