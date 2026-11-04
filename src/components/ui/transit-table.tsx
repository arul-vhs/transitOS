import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
}

interface TransitTableProps<T extends { id: string }> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  filters?: {
    key: string;
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
  }[];
  emptyMessage?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  rowDetailTitle?: (item: T) => string;
  rowDetailSubtitle?: (item: T) => string;
  renderRowDetail?: (item: T, onClose: () => void) => React.ReactNode;
  actions?: React.ReactNode;
  exportCsvName?: string;
}

export function TransitTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Search...",
  searchFilter,
  filters,
  emptyMessage = "No records found.",
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  rowDetailTitle,
  rowDetailSubtitle,
  renderRowDetail,
  actions,
  exportCsvName,
}: TransitTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // reset to page 1 on new search
    }, 200);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    const q = debouncedSearch.toLowerCase().trim();

    if (searchFilter) {
      return data.filter((item) => searchFilter(item, q));
    }

    return data.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, debouncedSearch, searchFilter]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-clamp page if data shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  const handleExportCsv = () => {
    if (!filteredData.length) return;
    const keys = columns
      .filter((c) => c.accessorKey)
      .map((c) => String(c.accessorKey));

    const csvHeaders = columns
      .filter((c) => c.accessorKey)
      .map((c) => `"${c.header}"`)
      .join(",");

    const rows = filteredData.map((item) =>
      keys
        .map((k) => {
          const val = (item as any)[k];
          return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ""}"`;
        })
        .join(","),
    );

    const csvContent = [csvHeaders, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${exportCsvName || "transit-export"}-${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Search, Filters, Page Size & Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[260px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs rounded-md border-border bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Optional Dropdown Filters */}
          {filters?.map((f) => (
            <Select key={f.key} value={f.value} onValueChange={f.onChange}>
              <SelectTrigger className="w-[140px] md:w-[160px] h-8 text-xs rounded-md border-border bg-background">
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                {f.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {/* Right Toolbar: CSV Export & Custom Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {exportCsvName && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 gap-1.5 text-xs rounded-md border-border hover:bg-muted font-medium"
              title="Export CSV"
            >
              <FileSpreadsheet className="size-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {columns.map((col, idx) => (
                  <TableHead
                    key={idx}
                    className={cn(
                      "text-xs font-bold text-foreground py-2.5 px-3",
                      col.headerClassName,
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-12 text-xs text-muted-foreground"
                  >
                    Loading records...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-12 text-xs text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => {
                      if (renderRowDetail) setSelectedRow(item);
                    }}
                    className={cn(
                      "transition-colors",
                      renderRowDetail && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    {columns.map((col, cIdx) => (
                      <TableCell
                        key={cIdx}
                        className={cn("text-xs py-2.5 px-3", col.className)}
                      >
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                            ? String((item as any)[col.accessorKey] ?? "")
                            : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server/Client Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 bg-muted/20 text-xs text-muted-foreground">
          {/* Left: Total counts & Current page indicator */}
          <div className="flex items-center gap-2 font-mono">
            <span>
              Showing{" "}
              <strong className="text-foreground">
                {totalItems === 0 ? 0 : startIndex + 1}
              </strong>
              {" – "}
              <strong className="text-foreground">{endIndex}</strong> of{" "}
              <strong className="text-foreground">{totalItems}</strong> records
            </span>
          </div>

          {/* Right: Page Size Selector & Navigation Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-[11px] text-muted-foreground">Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-[68px] text-[11px] rounded-md border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="size-7 p-0 rounded-md border-border"
                title="First Page"
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-7 p-0 rounded-md border-border"
                title="Previous Page"
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <span className="px-2 text-[11px] font-mono font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="size-7 p-0 rounded-md border-border"
                title="Next Page"
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="size-7 p-0 rounded-md border-border"
                title="Last Page"
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Row Slide-over Details Sheet */}
      {renderRowDetail && (
        <Sheet
          open={!!selectedRow}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedRow(null);
          }}
        >
          <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
            {selectedRow && (
              <div className="flex h-full flex-col">
                <SheetHeader className="p-4 border-b border-border bg-muted/30">
                  <SheetTitle className="text-sm font-bold text-foreground">
                    {rowDetailTitle ? rowDetailTitle(selectedRow) : "Record Details"}
                  </SheetTitle>
                  {rowDetailSubtitle && (
                    <SheetDescription className="text-xs text-muted-foreground font-mono">
                      {rowDetailSubtitle(selectedRow)}
                    </SheetDescription>
                  )}
                </SheetHeader>
                <div className="flex-1 p-4">
                  {renderRowDetail(selectedRow, () => setSelectedRow(null))}
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
