import {
  SheetsConfigError,
  SheetsPermissionError,
} from "@/lib/sheets";

export type SheetsUiError = {
  title: string;
  description: string;
  showShareSteps: boolean;
};

export function toSheetsUiError(error: unknown): SheetsUiError {
  if (error instanceof SheetsPermissionError) {
    return {
      title: "Share the Google Sheet",
      description: error.message,
      showShareSteps: true,
    };
  }

  if (error instanceof SheetsConfigError) {
    return {
      title: "Google Sheets setup incomplete",
      description: error.message,
      showShareSteps: true,
    };
  }

  return {
    title: "Could not load member directory",
    description:
      error instanceof Error
        ? error.message
        : "An unexpected Google Sheets error occurred.",
    showShareSteps: false,
  };
}
