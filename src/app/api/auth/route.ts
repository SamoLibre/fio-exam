import { NextResponse } from "next/server";
import { initialData } from "@/lib/initialData";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cleanUsername = (username || "").toLowerCase().trim();

    // Teacher account: Elif
    if (
      (cleanUsername === "elif" || cleanUsername === "ogretmen" || cleanUsername === "admin") &&
      (password === "elif2026" || password === "elif123" || password === "123456")
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

    // Student credentials
    const student = initialData.students.find(
      (s) => s.username.toLowerCase() === cleanUsername
    );

    if (student) {
      if (!student.password || student.password === password) {
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
