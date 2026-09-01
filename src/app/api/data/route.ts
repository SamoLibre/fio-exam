import { NextResponse } from "next/server";
import { initialData } from "@/lib/initialData";
import { AppData } from "@/types";

// Persistent memory cache for serverless runtime
let serverData: AppData = { ...initialData };

export async function GET() {
  return NextResponse.json(serverData);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.students && body.exams) {
      serverData = {
        students: body.students,
        exams: body.exams,
      };
      return NextResponse.json({ success: true, data: serverData });
    }
    return NextResponse.json({ error: "Geçersiz veri formatı" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
