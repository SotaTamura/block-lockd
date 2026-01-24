import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async () => {
    try {
        const users = await prisma.user.findMany();
        return NextResponse.json({ message: "success", users }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

// project://src/app/context.tsx
export const POST = async (req: NextRequest) => {
    try {
        const { id, name } = await req.json();

        // Check if user already exists
        if (
            await prisma.user.findFirst({
                where: { name },
            })
        ) {
            return NextResponse.json({ message: "このユーザー名は既に使用されています" }, { status: 409 });
        }
        const user = await prisma.user.create({
            data: { id, name },
        });
        return NextResponse.json({ message: "success", user: user }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
