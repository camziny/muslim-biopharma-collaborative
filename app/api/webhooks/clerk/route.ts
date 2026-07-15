import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { deleteMemberByClerkUserId } from "@/lib/sheets";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    if (event.type === "user.deleted") {
      const userId = event.data.id;
      if (userId) {
        await deleteMemberByClerkUserId(userId);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Clerk webhook error:", error);
    return new Response("Webhook verification failed", { status: 400 });
  }
}
