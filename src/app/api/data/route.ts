import { NextResponse } from "next/server";
import { AppData } from "@/types";

const GIST_ID = "7b8d5ae5f7e338c72523cc8437a0c3fc";

function getGithubToken(): string {
  return process.env.GITHUB_DB_TOKEN ? process.env.GITHUB_DB_TOKEN.trim() : "";
}

let inMemoryCache: AppData | null = null;

export async function GET() {
  const token = getGithubToken();
  if (token) {
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "FIO-Exam-App",
          Accept: "application/vnd.github.v3+json",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const gist = await res.json();
        const content = gist.files?.["fio_exam_db.json"]?.content;
        if (content) {
          const parsed: AppData = JSON.parse(content);
          inMemoryCache = parsed;
          return NextResponse.json(parsed);
        }
      }
    } catch (err) {
      console.error("Gist DB read error:", err);
    }
  }

  return NextResponse.json(inMemoryCache || { students: [], exams: [] });
}

export async function POST(req: Request) {
  const token = getGithubToken();
  try {
    const body = await req.json();
    if (body && Array.isArray(body.students)) {
      const payload: AppData = {
        students: body.students,
        exams: body.exams || [],
      };

      inMemoryCache = payload;

      if (token) {
        // Persist to GitHub Gist
        const patchRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
          method: "PATCH",
          headers: {
            Authorization: `token ${token}`,
            "User-Agent": "FIO-Exam-App",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            files: {
              "fio_exam_db.json": {
                content: JSON.stringify(payload, null, 2),
              },
            },
          }),
        });

        if (!patchRes.ok) {
          console.error("Gist DB write non-ok status:", patchRes.status);
        }
      }

      return NextResponse.json({ success: true, data: payload });
    }
    return NextResponse.json({ error: "Geçersiz veri formatı" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
