import { NextResponse } from "next/server";

// Server-side analysis has been removed in this frontend-only version.
export async function POST() {
  return NextResponse.json({ error: "Server-side analysis removed; use frontend preview." }, { status: 410 });
}

export async function GET() {
  return NextResponse.json({ message: "Server-side analyze endpoint disabled in frontend-only mode." }, { status: 200 });
}
