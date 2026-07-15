import { google } from "googleapis";

function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!email || !privateKey || !sheetId) {
    throw new Error(
      "Missing Google Sheets configuration. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID.",
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

function columnLetter(index) {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function quoteSheetName(name) {
  return `'${name.replace(/'/g, "''")}'`;
}

async function main() {
  const { sheets, sheetId } = getSheetsClient();

  const meta = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
    fields: "sheets.properties(title)",
  });
  const tabTitle = meta.data.sheets?.[0]?.properties?.title;
  if (!tabTitle) {
    throw new Error("No worksheet tabs found.");
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: quoteSheetName(tabTitle),
  });

  const rows = response.data.values ?? [];
  const headerRowOffset = rows.findIndex((row) =>
    row.some((cell) => cell?.trim()?.toLowerCase() === "name"),
  );
  if (headerRowOffset < 0) {
    throw new Error('Could not find a header row containing "Name".');
  }

  let header = [...(rows[headerRowOffset] ?? [])];
  if (!header.includes("registered_at")) {
    header.push("registered_at");
  }
  if (!header.includes("whatsapp_sent")) {
    header.push("whatsapp_sent");
  }

  const headerRowIndex = headerRowOffset + 1;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${quoteSheetName(tabTitle)}!A${headerRowIndex}:${columnLetter(header.length - 1)}${headerRowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [header] },
  });

  const registeredAtIndex = header.indexOf("registered_at");
  const dataRows = rows.slice(headerRowOffset + 1);
  const timestamp = new Date().toISOString();
  const updates = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index] ?? [];
    const hasContent = row.some((cell) => cell?.trim());
    const registeredAt = row[registeredAtIndex]?.trim();

    if (hasContent && !registeredAt) {
      const rowNumber = headerRowIndex + 1 + index;
      updates.push({
        range: `${quoteSheetName(tabTitle)}!${columnLetter(registeredAtIndex)}${rowNumber}`,
        values: [[timestamp]],
      });
    }
  }

  if (updates.length === 0) {
    console.log("No rows needed backfill.");
    return;
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: updates,
    },
  });

  console.log(`Backfilled registered_at for ${updates.length} member row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
