import { NextRequest, NextResponse } from "next/server";
import { updateAssetStatus } from "@/lib/asset/service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });
  const asset = await updateAssetStatus(id, status);
  return NextResponse.json(asset);
}
