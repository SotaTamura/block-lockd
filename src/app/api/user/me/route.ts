import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get("userId");

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId.value, 10) },
            });

            if (user) {
                const { password, ...userWithoutPassword } = user;
                return NextResponse.json({ message: "success", user: userWithoutPassword }, { status: 200 });
            } else {
                return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
            }
        } else {
            return NextResponse.json({ message: "ログインしていません" }, { status: 401 });
        }
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
