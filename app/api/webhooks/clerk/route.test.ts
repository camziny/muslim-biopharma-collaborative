import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  deleteMemberByClerkUserId: vi.fn(),
}));

import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/webhooks/clerk/route";
import { deleteMemberByClerkUserId } from "@/lib/sheets";

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the sheet row when a Clerk user is deleted", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.deleted",
      data: { id: "user_123", deleted: true, object: "user" },
    } as never);
    vi.mocked(deleteMemberByClerkUserId).mockResolvedValue(true);

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(deleteMemberByClerkUserId).toHaveBeenCalledWith("user_123");
  });

  it("ignores unrelated webhook events", async () => {
    vi.mocked(verifyWebhook).mockResolvedValue({
      type: "user.created",
      data: { id: "user_123" },
    } as never);

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(deleteMemberByClerkUserId).not.toHaveBeenCalled();
  });

  it("returns 400 when verification fails", async () => {
    vi.mocked(verifyWebhook).mockRejectedValue(new Error("bad signature"));

    const response = await POST(
      new NextRequest("http://localhost/api/webhooks/clerk", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
  });
});
