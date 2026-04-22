import { NextResponse } from "next/server";
import { fetchAllArticles } from "@/lib/rss";

export const revalidate = 300;

export async function GET() {
  try {
    const articles = await fetchAllArticles();
    return NextResponse.json({ articles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
