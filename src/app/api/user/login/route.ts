import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export const POST = async (req: NextRequest) => {
    try {
        const { name, password } = await req.json();

        const user = await prisma.user.findFirst({
            where: { name },
        });

        if (user) {
            if (await bcrypt.compare(password, user.password)) {
                // パスワードは返さないようにする
                const { password, ...userWithoutPassword } = user;
                (await cookies()).set("userId", user.id.toString(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
                return NextResponse.json({ message: "success", user: userWithoutPassword }, { status: 200 });
            } else {
                return NextResponse.json({ message: "ユーザー名またはパスワードが正しくありません" }, { status: 401 });
            }
        } else {
            return NextResponse.json({ message: "ユーザー名またはパスワードが正しくありません" }, { status: 401 });
        }
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
