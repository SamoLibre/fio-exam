import { NextResponse } from "next/server";
import { AppData } from "@/types";

const CLOUD_DB_ID = "ff808181a061cdc401a061f2bbd9007e";
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_DB_ID}`;

// In-memory fallback
let inMemoryData: AppData = {
  students: [],
  exams: [],
};

export async function GET() {
  try {
    const res = await fetch(CLOUD_URL, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data && Array.isArray(json.data.students)) {
        inMemoryData = {
          students: json.data.students || [],
          exams: json.data.exams || [],
        };
        return NextResponse.json(inMemoryData);
      }
    }
  } catch (err) {
    console.error("Cloud DB read error:", err);
  }

  return NextResponse.json(inMemoryData);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body && Array.isArray(body.students)) {
      const payload: AppData = {
        students: body.students,
        exams: body.exams || [],
      };

      inMemoryData = payload;

      // Sync to persistent Cloud DB
      await fetch(CLOUD_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "fio_exam_db",
          data: payload,
        }),
      }).catch((e) => console.error("Cloud DB write error:", e));

      return NextResponse.json({ success: true, data: inMemoryData });
    }
    return NextResponse.json({ error: "Geçersiz veri formatı" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
