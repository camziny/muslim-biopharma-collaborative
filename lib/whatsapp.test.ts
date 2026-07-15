import { afterEach, describe, expect, it } from "vitest";
import { makeMember } from "@/lib/test-fixtures";
import {
  getWhatsAppInviteLink,
  isProfileComplete,
  isRegisteredMember,
} from "@/lib/whatsapp";

describe("isRegisteredMember", () => {
  it("returns true when registered_at is set", () => {
    expect(isRegisteredMember("2026-07-15T12:00:00.000Z")).toBe(true);
  });

  it("returns false for empty or whitespace values", () => {
    expect(isRegisteredMember("")).toBe(false);
    expect(isRegisteredMember("   ")).toBe(false);
  });
});

describe("isProfileComplete", () => {
  it("returns true for a fully filled registered member", () => {
    expect(isProfileComplete(makeMember())).toBe(true);
  });

  it("returns false when registered_at is missing", () => {
    expect(isProfileComplete(makeMember({ registeredAt: "" }))).toBe(false);
  });

  it("returns false when a required field is blank", () => {
    expect(isProfileComplete(makeMember({ name: "" }))).toBe(false);
    expect(isProfileComplete(makeMember({ company: "  " }))).toBe(false);
    expect(isProfileComplete(makeMember({ title: "" }))).toBe(false);
    expect(isProfileComplete(makeMember({ function: "" }))).toBe(false);
    expect(isProfileComplete(makeMember({ diseaseAreas: "" }))).toBe(false);
  });
});

describe("getWhatsAppInviteLink", () => {
  afterEach(() => {
    delete process.env.WHATSAPP_INVITE_LINK;
  });

  it("returns the trimmed invite link", () => {
    process.env.WHATSAPP_INVITE_LINK = " https://chat.whatsapp.com/abc ";
    expect(getWhatsAppInviteLink()).toBe("https://chat.whatsapp.com/abc");
  });

  it("returns null when unset or blank", () => {
    delete process.env.WHATSAPP_INVITE_LINK;
    expect(getWhatsAppInviteLink()).toBeNull();

    process.env.WHATSAPP_INVITE_LINK = "   ";
    expect(getWhatsAppInviteLink()).toBeNull();
  });
});
