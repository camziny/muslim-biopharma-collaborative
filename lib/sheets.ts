import { google } from "googleapis";
import {
  type AdminMemberFormValues,
  type Member,
  type MemberFormValues,
  SHEET_COLUMNS,
} from "@/lib/member-schema";

type ColumnKey =
  | "name"
  | "company"
  | "title"
  | "function"
  | "diseaseAreas"
  | "emailWork"
  | "emailPersonal"
  | "phone"
  | "registeredAt"
  | "whatsappSent"
  | "clerkUserId";

const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  name: ["Name"],
  company: ["Company"],
  title: ["Title"],
  function: ["Function"],
  diseaseAreas: ["Disease Areas / Platform of Focus"],
  emailWork: ["Email (work)"],
  emailPersonal: ["Email (personal)"],
  phone: ["Phone (optional)", "Phone"],
  registeredAt: ["registered_at"],
  whatsappSent: ["whatsapp_sent"],
  clerkUserId: ["clerk_user_id"],
};

const REQUIRED_HEADERS = [
  "name",
  "company",
  "title",
  "function",
  "diseaseAreas",
  "emailWork",
] as const satisfies readonly ColumnKey[];

export class SheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsConfigError";
  }
}

export class SheetsPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsPermissionError";
  }
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GOOGLE_PRIVATE_KEY?.trim() &&
      process.env.GOOGLE_SHEET_ID?.trim(),
  );
}

function getServiceAccountEmail() {
  return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
}

async function withSheetsErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (
      error instanceof SheetsConfigError ||
      error instanceof SheetsPermissionError
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "number"
        ? (error as { code: number }).code
        : undefined;

    if (code === 403 || /permission|forbidden/i.test(message)) {
      throw new SheetsPermissionError(
        `The service account cannot access this spreadsheet. Share the Google Sheet with ${getServiceAccountEmail()} as Editor.`,
      );
    }

    if (code === 404 || /not found/i.test(message)) {
      throw new SheetsConfigError(
        "Spreadsheet not found. Check GOOGLE_SHEET_ID.",
      );
    }

    throw new Error(`Google Sheets error: ${message}`);
  }
}

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID?.trim();

  if (!email || !privateKey || !sheetId) {
    throw new SheetsConfigError(
      "Google Sheets is not configured yet. Add GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY to .env.local.",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    sheetId,
  };
}

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function parseBoolean(value: string | undefined) {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

function columnLetter(index: number) {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function quoteSheetName(name: string) {
  return `'${name.replace(/'/g, "''")}'`;
}

function buildColumnMap(header: string[]) {
  const map = {} as Record<ColumnKey, number>;

  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [
    ColumnKey,
    string[],
  ][]) {
    const index = header.findIndex((cell) =>
      aliases.some(
        (alias) => cell?.trim().toLowerCase() === alias.toLowerCase(),
      ),
    );
    if (index >= 0) {
      map[key] = index;
    }
  }

  for (const key of REQUIRED_HEADERS) {
    if (map[key] === undefined) {
      throw new SheetsConfigError(
        `Sheet is missing required column "${HEADER_ALIASES[key][0]}". Found headers: ${header.join(" | ") || "(empty)"}`,
      );
    }
  }

  return map;
}

type SheetContext = {
  sheets: ReturnType<typeof google.sheets>;
  spreadsheetId: string;
  tabTitle: string;
  tabSheetId: number;
  headerRowIndex: number;
  header: string[];
  columnMap: Record<ColumnKey, number>;
  dataRows: string[][];
};

function cell(row: string[], index: number | undefined) {
  if (index === undefined) return "";
  return row[index]?.trim() ?? "";
}

function rowToMember(
  rowIndex: number,
  values: string[],
  columnMap: Record<ColumnKey, number>,
): Member {
  return {
    rowIndex,
    name: cell(values, columnMap.name),
    company: cell(values, columnMap.company),
    title: cell(values, columnMap.title),
    function: cell(values, columnMap.function),
    diseaseAreas: cell(values, columnMap.diseaseAreas),
    emailWork: cell(values, columnMap.emailWork),
    emailPersonal: cell(values, columnMap.emailPersonal),
    phone: cell(values, columnMap.phone),
    registeredAt: cell(values, columnMap.registeredAt),
    whatsappSent: parseBoolean(cell(values, columnMap.whatsappSent)),
    clerkUserId: cell(values, columnMap.clerkUserId),
  };
}

function memberFieldsToSparseRow(
  columnMap: Record<ColumnKey, number>,
  headerLength: number,
  fields: Partial<Record<ColumnKey, string>>,
) {
  const row = Array.from({ length: headerLength }, () => "");
  for (const [key, value] of Object.entries(fields) as [ColumnKey, string][]) {
    const index = columnMap[key];
    if (index !== undefined) {
      row[index] = value;
    }
  }
  return row;
}

async function ensureAppColumns(ctx: Omit<SheetContext, "columnMap" | "dataRows" | "header"> & {
  header: string[];
  headerRowIndex: number;
}) {
  let header = [...ctx.header];
  let changed = false;

  for (const column of [
    "registered_at",
    "whatsapp_sent",
    "clerk_user_id",
  ] as const) {
    if (!header.some((cell) => cell?.trim() === column)) {
      header.push(column);
      changed = true;
    }
  }

  if (!changed) {
    return header;
  }

  await ctx.sheets.spreadsheets.values.update({
    spreadsheetId: ctx.spreadsheetId,
    range: `${quoteSheetName(ctx.tabTitle)}!A${ctx.headerRowIndex}:${columnLetter(header.length - 1)}${ctx.headerRowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [header],
    },
  });

  return header;
}

async function loadSheetContext(): Promise<SheetContext> {
  return withSheetsErrors(async () => {
    const { sheets, sheetId: spreadsheetId } = getSheetsClient();

    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties(sheetId,title,index)",
    });

    const firstSheet = meta.data.sheets?.[0]?.properties;
    const tabTitle = firstSheet?.title;
    const tabSheetId = firstSheet?.sheetId;

    if (!tabTitle || tabSheetId === undefined || tabSheetId === null) {
      throw new SheetsConfigError("No worksheet tabs found in this spreadsheet.");
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: quoteSheetName(tabTitle),
    });

    const rows = response.data.values ?? [];
    const headerRowOffset = rows.findIndex((row) =>
      row.some((cell) => cell?.trim().toLowerCase() === "name"),
    );

    if (headerRowOffset < 0) {
      throw new SheetsConfigError(
        'Could not find a header row containing "Name". Add the directory headers to the first worksheet.',
      );
    }

    const headerRowIndex = headerRowOffset + 1;
    let header = [...(rows[headerRowOffset] ?? [])];

    header = await ensureAppColumns({
      sheets,
      spreadsheetId,
      tabTitle,
      tabSheetId,
      header,
      headerRowIndex,
    });

    const columnMap = buildColumnMap(header);
    const dataRows = rows.slice(headerRowOffset + 1);

    return {
      sheets,
      spreadsheetId,
      tabTitle,
      tabSheetId,
      headerRowIndex,
      header,
      columnMap,
      dataRows,
    };
  });
}

function findMemberRow(ctx: SheetContext, email: string) {
  const normalized = normalizeEmail(email);
  const emailIndex = ctx.columnMap.emailWork;

  for (let index = 0; index < ctx.dataRows.length; index += 1) {
    const row = ctx.dataRows[index] ?? [];
    const workEmail = row[emailIndex]?.trim();
    if (workEmail && normalizeEmail(workEmail) === normalized) {
      const rowIndex = ctx.headerRowIndex + 1 + index;
      return {
        rowIndex,
        member: rowToMember(rowIndex, row, ctx.columnMap),
      };
    }
  }

  return null;
}

function formToFieldMap(
  values: MemberFormValues,
  emailWork: string,
  registeredAt: string,
  whatsappSent: boolean,
  clerkUserId = "",
): Partial<Record<ColumnKey, string>> {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    title: values.title.trim(),
    function: values.function.trim(),
    diseaseAreas: values.diseaseAreas.trim(),
    emailWork: emailWork.trim(),
    emailPersonal: values.emailPersonal?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    registeredAt,
    whatsappSent: whatsappSent ? "true" : "false",
    clerkUserId,
  };
}

export async function getMemberByEmail(email: string): Promise<Member | null> {
  const ctx = await loadSheetContext();
  return findMemberRow(ctx, email)?.member ?? null;
}

export async function listMembers(): Promise<Member[]> {
  const ctx = await loadSheetContext();
  return ctx.dataRows
    .map((row, index) => {
      const rowIndex = ctx.headerRowIndex + 1 + index;
      return rowToMember(rowIndex, row, ctx.columnMap);
    })
    .filter((member) =>
      Boolean(
        member.name ||
          member.emailWork ||
          member.company ||
          member.title ||
          member.function,
      ),
    );
}

export async function getMemberByRow(rowIndex: number): Promise<Member | null> {
  const members = await listMembers();
  return members.find((member) => member.rowIndex === rowIndex) ?? null;
}

export async function createMember(
  emailWork: string,
  values: MemberFormValues,
  clerkUserId = "",
): Promise<Member> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    if (findMemberRow(ctx, emailWork)) {
      throw new Error("A member with this work email already exists.");
    }

    const registeredAt = new Date().toISOString();
    const fields = formToFieldMap(
      values,
      emailWork,
      registeredAt,
      false,
      clerkUserId,
    );
    const row = memberFieldsToSparseRow(ctx.columnMap, ctx.header.length, fields);

    await ctx.sheets.spreadsheets.values.append({
      spreadsheetId: ctx.spreadsheetId,
      range: quoteSheetName(ctx.tabTitle),
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [row],
      },
    });

    const created = await getMemberByEmail(emailWork);
    if (!created) {
      throw new Error("Failed to create member row.");
    }
    return created;
  });
}

export async function updateMemberByEmail(
  emailWork: string,
  values: MemberFormValues,
  clerkUserId?: string,
): Promise<Member> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const match = findMemberRow(ctx, emailWork);
    if (!match) {
      throw new Error("Member not found.");
    }

    const fields = formToFieldMap(
      values,
      match.member.emailWork,
      match.member.registeredAt || new Date().toISOString(),
      match.member.whatsappSent,
      clerkUserId ?? match.member.clerkUserId,
    );
    const row = memberFieldsToSparseRow(ctx.columnMap, ctx.header.length, fields);

    await ctx.sheets.spreadsheets.values.update({
      spreadsheetId: ctx.spreadsheetId,
      range: `${quoteSheetName(ctx.tabTitle)}!A${match.rowIndex}:${columnLetter(ctx.header.length - 1)}${match.rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    const updated = await getMemberByEmail(emailWork);
    if (!updated) {
      throw new Error("Failed to update member row.");
    }
    return updated;
  });
}

export async function updateMemberByRow(
  rowIndex: number,
  values: AdminMemberFormValues,
): Promise<Member> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const dataIndex = rowIndex - ctx.headerRowIndex - 1;
    if (dataIndex < 0 || dataIndex >= ctx.dataRows.length) {
      throw new Error("Member row not found.");
    }

    const existing = rowToMember(
      rowIndex,
      ctx.dataRows[dataIndex] ?? [],
      ctx.columnMap,
    );

    const fields = formToFieldMap(
      values,
      values.emailWork,
      existing.registeredAt || new Date().toISOString(),
      existing.whatsappSent,
      existing.clerkUserId,
    );
    const row = memberFieldsToSparseRow(ctx.columnMap, ctx.header.length, fields);

    await ctx.sheets.spreadsheets.values.update({
      spreadsheetId: ctx.spreadsheetId,
      range: `${quoteSheetName(ctx.tabTitle)}!A${rowIndex}:${columnLetter(ctx.header.length - 1)}${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    const members = await listMembers();
    const updated = members.find((member) => member.rowIndex === rowIndex);
    if (!updated) {
      throw new Error("Failed to update member row.");
    }
    return updated;
  });
}

export async function deleteMemberByRow(rowIndex: number): Promise<void> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();

    await ctx.sheets.spreadsheets.batchUpdate({
      spreadsheetId: ctx.spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: ctx.tabSheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });
  });
}

export async function deleteMemberByEmail(emailWork: string): Promise<boolean> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const match = findMemberRow(ctx, emailWork);
    if (!match) return false;
    await deleteMemberByRow(match.rowIndex);
    return true;
  });
}

export async function deleteMemberByClerkUserId(
  clerkUserId: string,
): Promise<boolean> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const clerkIndex = ctx.columnMap.clerkUserId;
    if (clerkIndex === undefined || !clerkUserId.trim()) {
      return false;
    }

    for (let index = 0; index < ctx.dataRows.length; index += 1) {
      const row = ctx.dataRows[index] ?? [];
      if (row[clerkIndex]?.trim() === clerkUserId) {
        const rowIndex = ctx.headerRowIndex + 1 + index;
        await deleteMemberByRow(rowIndex);
        return true;
      }
    }

    return false;
  });
}

/** Persist Clerk user id on the member row (for webhook account deletion). */
export async function syncClerkUserId(
  emailWork: string,
  clerkUserId: string,
): Promise<void> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const match = findMemberRow(ctx, emailWork);
    const clerkIndex = ctx.columnMap.clerkUserId;

    if (
      !match ||
      !clerkUserId.trim() ||
      clerkIndex === undefined ||
      match.member.clerkUserId === clerkUserId
    ) {
      return;
    }

    await ctx.sheets.spreadsheets.values.update({
      spreadsheetId: ctx.spreadsheetId,
      range: `${quoteSheetName(ctx.tabTitle)}!${columnLetter(clerkIndex)}${match.rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[clerkUserId]],
      },
    });
  });
}

export async function markWhatsAppSent(emailWork: string): Promise<void> {
  return withSheetsErrors(async () => {
    const ctx = await loadSheetContext();
    const match = findMemberRow(ctx, emailWork);
    const whatsappIndex = ctx.columnMap.whatsappSent;

    if (!match || match.member.whatsappSent || whatsappIndex === undefined) {
      return;
    }

    await ctx.sheets.spreadsheets.values.update({
      spreadsheetId: ctx.spreadsheetId,
      range: `${quoteSheetName(ctx.tabTitle)}!${columnLetter(whatsappIndex)}${match.rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["true"]],
      },
    });
  });
}

export async function validateSheetSetup(): Promise<void> {
  const ctx = await loadSheetContext();
  for (const column of SHEET_COLUMNS) {
    if (!ctx.header.some((cell) => cell?.trim() === column)) {
      throw new SheetsConfigError(`Missing column after setup: ${column}`);
    }
  }
}
