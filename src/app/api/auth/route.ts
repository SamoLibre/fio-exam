import { NextResponse } from "next/server";
import { AppData, Student } from "@/types";

const CLOUD_DB_ID = "ff808181a061cdc401a061f2bbd9007e";
const CLOUD_URL = `https://api.restful-api.dev/objects/${CLOUD_DB_ID}`;

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

    // 2. Student check from Cloud DB
    let students: Student[] = [];
    try {
      const res = await fetch(CLOUD_URL, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && Array.isArray(json.data.students)) {
          students = json.data.students;
        }
      }
    } catch (err) {
      console.error("Auth Cloud DB fetch error:", err);
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
