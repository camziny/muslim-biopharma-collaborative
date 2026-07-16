"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminDeleteMember,
  adminSetMemberRole,
} from "@/app/actions/members";
import { AdminMemberForm } from "@/components/member-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  filterAndSortMembers,
  getSortColumn,
  getSortDirection,
  toggleColumnSort,
  type AdminDirectoryRoleFilter,
  type AdminDirectorySort,
  type AdminDirectorySortColumn,
} from "@/lib/admin-directory-query";
import {
  memberToAdminFormValues,
  type Member,
} from "@/lib/member-schema";
import { cn } from "@/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;

const selectClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
);

export type AdminMemberRow = Member & {
  hasClerkAccount: boolean;
  isAdmin: boolean;
};

type AdminDirectoryProps = {
  members: AdminMemberRow[];
  currentUserEmail: string;
};

type ConfirmAction =
  | { type: "delete"; member: AdminMemberRow }
  | { type: "make-admin"; member: AdminMemberRow }
  | { type: "remove-admin"; member: AdminMemberRow };

function formatDate(registeredAt: string) {
  if (!registeredAt) return "—";
  return new Date(registeredAt).toLocaleDateString();
}

const ROLE_FILTERS: { value: AdminDirectoryRoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "admin", label: "Admins" },
  { value: "member", label: "Members" },
];

function SortableColumnHeader({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: AdminDirectorySortColumn;
  sort: AdminDirectorySort;
  onSort: (column: AdminDirectorySortColumn) => void;
  className?: string;
}) {
  const active = getSortColumn(sort) === column;
  const direction = active ? getSortDirection(sort) : null;
  const ariaSort =
    direction === "asc"
      ? "ascending"
      : direction === "desc"
        ? "descending"
        : "none";

  return (
    <TableHead aria-sort={ariaSort} className={className}>
      <button
        type="button"
        title={`Sort by ${label}`}
        className={cn(
          "-ml-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-left font-medium transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground",
        )}
        onClick={() => onSort(column)}
      >
        {label}
        {direction === "asc" ? (
          <ArrowUp className="size-3.5 shrink-0" aria-hidden />
        ) : direction === "desc" ? (
          <ArrowDown className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ArrowUpDown className="size-3.5 shrink-0 opacity-40" aria-hidden />
        )}
        <span className="sr-only">
          {active
            ? `Sorted ${direction === "asc" ? "ascending" : "descending"}. Activate to reverse.`
            : "Activate to sort"}
        </span>
      </button>
    </TableHead>
  );
}

function ActionsMenu({
  member,
  currentUserEmail,
  disabled,
  onEdit,
  onConfirm,
}: {
  member: AdminMemberRow;
  currentUserEmail: string;
  disabled: boolean;
  onEdit: () => void;
  onConfirm: (action: ConfirmAction) => void;
}) {
  const isSelf =
    member.emailWork.toLowerCase() === currentUserEmail.toLowerCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${member.name || member.emailWork}`}
            disabled={disabled}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-48">
        <DropdownMenuItem onClick={onEdit}>Edit profile</DropdownMenuItem>

        {member.hasClerkAccount ? (
          member.isAdmin ? (
            <DropdownMenuItem
              disabled={isSelf}
              onClick={() => onConfirm({ type: "remove-admin", member })}
            >
              Remove admin access
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => onConfirm({ type: "make-admin", member })}
            >
              Grant admin access
            </DropdownMenuItem>
          )
        ) : (
          <DropdownMenuItem disabled>
            Grant admin access
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => onConfirm({ type: "delete", member })}
        >
          Remove from directory
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminDirectory({
  members,
  currentUserEmail,
}: AdminDirectoryProps) {
  const router = useRouter();
  const [editingMember, setEditingMember] = useState<AdminMemberRow | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<AdminDirectoryRoleFilter>("all");
  const [sort, setSort] = useState<AdminDirectorySort>("name-asc");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const visibleMembers = filterAndSortMembers(members, {
    query: debouncedQuery,
    role: roleFilter,
    sort,
  });

  const hasActiveFilters =
    Boolean(searchInput.trim()) || roleFilter !== "all";

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedQuery("");
    setRoleFilter("all");
  };

  const handleColumnSort = (column: AdminDirectorySortColumn) => {
    setSort((current) => toggleColumnSort(current, column));
  };

  const runConfirmedAction = () => {
    if (!confirmAction) return;
    const { type, member } = confirmAction;

    startTransition(async () => {
      if (type === "delete") {
        const result = await adminDeleteMember(member.rowIndex);
        if (!result.success) {
          toast.error(result.message ?? "Unable to delete member.");
          return;
        }
        toast.success(result.message ?? "Member removed.");
      } else {
        const makeAdmin = type === "make-admin";
        const result = await adminSetMemberRole(member.emailWork, makeAdmin);
        if (!result.success) {
          toast.error(result.message ?? "Unable to update role.");
          return;
        }
        toast.success(result.message);
      }

      setConfirmAction(null);
      router.refresh();
    });
  };

  const confirmCopy = confirmAction
    ? {
        delete: {
          title: "Remove member?",
          description: `This permanently removes ${confirmAction.member.name || confirmAction.member.emailWork} from the directory and deletes their login account if they have one.`,
          action: "Remove",
          destructive: true,
        },
        "make-admin": {
          title: "Grant admin access?",
          description: `${confirmAction.member.name || confirmAction.member.emailWork} will be able to manage all members in the directory.`,
          action: "Grant access",
          destructive: false,
        },
        "remove-admin": {
          title: "Remove admin access?",
          description: `${confirmAction.member.name || confirmAction.member.emailWork} will no longer be able to access the admin directory.`,
          action: "Remove access",
          destructive: true,
        },
      }[confirmAction.type]
    : null;

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
        No members in the directory yet.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="admin-member-search">Search</Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="admin-member-search"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && searchInput) {
                    event.preventDefault();
                    setSearchInput("");
                    setDebouncedQuery("");
                  }
                }}
                placeholder="Search by name, company, email…"
                className="pr-8 pl-8"
                autoComplete="off"
                spellCheck={false}
              />
              {searchInput ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1 -translate-y-1/2"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchInput("");
                    setDebouncedQuery("");
                  }}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5 sm:shrink-0">
            <Label id="admin-member-role-label">Role</Label>
            <div
              role="group"
              aria-labelledby="admin-member-role-label"
              className="flex rounded-lg border border-input p-0.5"
            >
              {ROLE_FILTERS.map((option) => {
                const selected = roleFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "h-7 flex-1 rounded-md px-3 text-sm transition-colors sm:flex-none",
                      selected
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setRoleFilter(option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column headers handle sort on desktop; keep a control for mobile. */}
          <div className="space-y-1.5 md:hidden">
            <Label htmlFor="admin-member-sort">Sort by</Label>
            <select
              id="admin-member-sort"
              className={selectClassName}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as AdminDirectorySort)
              }
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="company-asc">Company A–Z</option>
              <option value="company-desc">Company Z–A</option>
              <option value="email-asc">Email A–Z</option>
              <option value="email-desc">Email Z–A</option>
              <option value="registered-desc">Newest first</option>
              <option value="registered-asc">Oldest first</option>
              <option value="role-desc">Admins first</option>
              <option value="role-asc">Members first</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p aria-live="polite" aria-atomic="true">
            {hasActiveFilters
              ? `${visibleMembers.length} of ${members.length} members`
              : `${visibleMembers.length} ${visibleMembers.length === 1 ? "member" : "members"}`}
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearFilters}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {visibleMembers.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No members match your search or filters.
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={clearFilters}
            >
              Clear search and filters
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Mobile: list */}
          <div className="divide-y rounded-lg border md:hidden">
            {visibleMembers.map((member) => (
              <div
                key={member.rowIndex}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {member.name || "Unnamed"}
                    </p>
                    {member.isAdmin ? (
                      <span className="shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {member.company ? `${member.company} · ` : ""}
                    {member.emailWork}
                  </p>
                </div>

                <ActionsMenu
                  member={member}
                  currentUserEmail={currentUserEmail}
                  disabled={isPending}
                  onEdit={() => setEditingMember(member)}
                  onConfirm={setConfirmAction}
                />
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <SortableColumnHeader
                    label="Name"
                    column="name"
                    sort={sort}
                    onSort={handleColumnSort}
                    className="pl-4"
                  />
                  <SortableColumnHeader
                    label="Company"
                    column="company"
                    sort={sort}
                    onSort={handleColumnSort}
                  />
                  <SortableColumnHeader
                    label="Email"
                    column="email"
                    sort={sort}
                    onSort={handleColumnSort}
                  />
                  <SortableColumnHeader
                    label="Registered"
                    column="registered"
                    sort={sort}
                    onSort={handleColumnSort}
                  />
                  <SortableColumnHeader
                    label="Role"
                    column="role"
                    sort={sort}
                    onSort={handleColumnSort}
                  />
                  <TableHead className="w-10 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.map((member) => (
                  <TableRow key={member.rowIndex}>
                    <TableCell className="pl-4 font-medium">
                      {member.name || "Unnamed"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.company || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {member.emailWork}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.registeredAt)}
                    </TableCell>
                    <TableCell>
                      {member.isAdmin ? (
                        <span className="inline-flex rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium leading-none">
                          Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Member</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <ActionsMenu
                        member={member}
                        currentUserEmail={currentUserEmail}
                        disabled={isPending}
                        onEdit={() => setEditingMember(member)}
                        onConfirm={setConfirmAction}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editingMember)}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>
              Update directory details for {editingMember?.name}.
            </DialogDescription>
          </DialogHeader>
          {editingMember ? (
            <AdminMemberForm
              key={editingMember.rowIndex}
              rowIndex={editingMember.rowIndex}
              defaultValues={memberToAdminFormValues(editingMember)}
              onSuccess={() => {
                setEditingMember(null);
                router.refresh();
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmCopy?.destructive ? "destructive" : "default"}
              disabled={isPending}
              onClick={runConfirmedAction}
            >
              {isPending ? "Working..." : confirmCopy?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
