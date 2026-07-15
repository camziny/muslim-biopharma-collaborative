import { describe, expect, it } from "vitest";
import { SheetsConfigError, SheetsPermissionError } from "@/lib/sheets";
import { toSheetsUiError } from "@/lib/sheets-ui";

describe("toSheetsUiError", () => {
  it("maps permission errors to share instructions", () => {
    const ui = toSheetsUiError(
      new SheetsPermissionError("Share the sheet with the service account."),
    );

    expect(ui).toEqual({
      title: "Share the Google Sheet",
      description: "Share the sheet with the service account.",
      showShareSteps: true,
    });
  });

  it("maps config errors to setup incomplete", () => {
    const ui = toSheetsUiError(
      new SheetsConfigError("Missing GOOGLE_SHEET_ID."),
    );

    expect(ui).toEqual({
      title: "Google Sheets setup incomplete",
      description: "Missing GOOGLE_SHEET_ID.",
      showShareSteps: true,
    });
  });

  it("maps unexpected errors without share steps", () => {
    const ui = toSheetsUiError(new Error("boom"));

    expect(ui).toEqual({
      title: "Could not load member directory",
      description: "boom",
      showShareSteps: false,
    });
  });
});
