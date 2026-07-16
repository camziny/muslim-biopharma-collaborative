export type AdminDirectoryRoleFilter = "all" | "admin" | "member";

export type AdminDirectorySortColumn =
  | "name"
  | "company"
  | "email"
  | "registered"
  | "role";

export type AdminDirectorySort =
  | "name-asc"
  | "name-desc"
  | "company-asc"
  | "company-desc"
  | "email-asc"
  | "email-desc"
  | "registered-desc"
  | "registered-asc"
  | "role-asc"
  | "role-desc";

export type AdminDirectoryQueryable = {
  name: string;
  company: string;
  title: string;
  function: string;
  emailWork: string;
  registeredAt: string;
  isAdmin: boolean;
};

const DEFAULT_SORT_DIRECTION: Record<
  AdminDirectorySortColumn,
  "asc" | "desc"
> = {
  name: "asc",
  company: "asc",
  email: "asc",
  registered: "desc",
  role: "desc",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function getSortColumn(sort: AdminDirectorySort): AdminDirectorySortColumn {
  return sort.slice(0, sort.lastIndexOf("-")) as AdminDirectorySortColumn;
}

export function getSortDirection(sort: AdminDirectorySort): "asc" | "desc" {
  return sort.endsWith("desc") ? "desc" : "asc";
}

export function toggleColumnSort(
  current: AdminDirectorySort,
  column: AdminDirectorySortColumn,
): AdminDirectorySort {
  if (getSortColumn(current) !== column) {
    return `${column}-${DEFAULT_SORT_DIRECTION[column]}` as AdminDirectorySort;
  }

  const nextDirection = getSortDirection(current) === "asc" ? "desc" : "asc";
  return `${column}-${nextDirection}` as AdminDirectorySort;
}

export function memberMatchesSearch(
  member: AdminDirectoryQueryable,
  query: string,
) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const fields = [
    member.name,
    member.company,
    member.title,
    member.function,
    member.emailWork,
  ].map(normalize);

  return tokens.every((token) => fields.some((field) => field.includes(token)));
}

function comparePrimary(
  a: AdminDirectoryQueryable,
  b: AdminDirectoryQueryable,
  column: AdminDirectorySortColumn,
) {
  switch (column) {
    case "company":
      return compareText(a.company, b.company);
    case "email":
      return compareText(a.emailWork, b.emailWork);
    case "registered":
      return (a.registeredAt || "").localeCompare(b.registeredAt || "");
    case "role":
      return Number(a.isAdmin) - Number(b.isAdmin);
    case "name":
    default:
      return compareText(a.name || a.emailWork, b.name || b.emailWork);
  }
}

export function filterAndSortMembers<T extends AdminDirectoryQueryable>(
  members: T[],
  options: {
    query?: string;
    role?: AdminDirectoryRoleFilter;
    sort?: AdminDirectorySort;
  } = {},
): T[] {
  const query = options.query ?? "";
  const role = options.role ?? "all";
  const sort = options.sort ?? "name-asc";
  const column = getSortColumn(sort);
  const direction = getSortDirection(sort);

  const filtered = members.filter((member) => {
    if (role === "admin" && !member.isAdmin) return false;
    if (role === "member" && member.isAdmin) return false;
    return memberMatchesSearch(member, query);
  });

  return filtered.toSorted((a, b) => {
    const primary = comparePrimary(a, b, column);
    if (primary !== 0) {
      return direction === "asc" ? primary : -primary;
    }

    return compareText(a.name || a.emailWork, b.name || b.emailWork);
  });
}
