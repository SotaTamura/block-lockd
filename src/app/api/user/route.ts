import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest) => {
    try {
        const users = await prisma.user.findMany();
        return NextResponse.json({ message: "success", users: users.map(({ password, ...userWithoutPassword }) => userWithoutPassword) }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const { name, password } = await req.json();

        // Check if user already exists
        if (
            await prisma.user.findFirst({
                where: { name },
            })
        ) {
            return NextResponse.json({ message: "このユーザー名は既に使用されています" }, { status: 409 });
        }
        const user = await prisma.user.create({
            data: { name, password: await bcrypt.hash(password, 10) },
        });
        return NextResponse.json({ message: "success", user: user }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
