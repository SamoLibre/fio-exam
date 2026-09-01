import { NextResponse } from "next/server";
import { initialData } from "@/lib/initialData";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Teacher / Admin credentials
    if (
      (username === "ogretmen" || username === "admin" || username === "hoca") &&
      (password === "123456" || password === "123" || password === "admin")
    ) {
      return NextResponse.json({
        user: {
          id: "admin-1",
          name: "Öğretmen / Admin",
          username: username,
          role: "admin",
        },
      });
    }

    // Student credentials
    const student = initialData.students.find(
      (s) => s.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (student) {
      // Allow password "123" or whatever is set
      if (!student.password || student.password === password || password === "123" || password === "123456") {
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
