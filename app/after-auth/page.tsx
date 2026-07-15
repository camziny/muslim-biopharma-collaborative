import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getPostAuthPath } from "@/lib/post-auth";

export default async function AfterAuthPage() {
  await requireAuth();
  redirect(await getPostAuthPath());
}
