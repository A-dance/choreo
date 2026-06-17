import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/stripeAuth";
import { syncProfilePlanFromStripe } from "@/lib/stripeSync";

export async function POST(request: Request) {
  const user = await getUserFromAuthHeader(request);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const plan = await syncProfilePlanFromStripe(user.id, user.email);
  return NextResponse.json({ plan });
}
