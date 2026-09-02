import { NextResponse } from "next/server";
import { AppData, Student } from "@/types";

const GIST_ID = "7b8d5ae5f7e338c72523cc8437a0c3fc";

function getGithubToken(): string {
  return process.env.GITHUB_DB_TOKEN ? process.env.GITHUB_DB_TOKEN.trim() : "";
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cleanUsername = (username || "").toLowerCase().trim();
    const cleanPassword = (password || "").trim();

    // 1. Teacher account: Elif
    if (
      (cleanUsername === "elif" || cleanUsername === "ogretmen" || cleanUsername === "admin") &&
      (cleanPassword === "elif2026" || cleanPassword === "elif123" || cleanPassword === "123456")
    ) {
      return NextResponse.json({
        user: {
          id: "admin-elif",
          name: "Elif Öğretmen",
          username: "elif",
          role: "admin",
        },
      });
    }

    // 2. Student check from Gist DB
    const token = getGithubToken();
    let students: Student[] = [];
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
            students = parsed.students || [];
          }
        }
      } catch (err) {
        console.error("Auth Gist DB fetch error:", err);
      }
    }

    const student = students.find(
      (s) => s.username.toLowerCase() === cleanUsername
    );

    if (student) {
      if (!student.password || student.password.trim() === cleanPassword) {
        return NextResponse.json({
          user: {
            id: student.id,
            name: student.name,
            username: student.username,
            role: "student",
            studentId: student.id,
          },
        });
      }
    }

    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Giriş işlemi başarısız" }, { status: 500 });
  }
}
