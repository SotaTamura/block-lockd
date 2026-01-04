import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async () => {
    try {
        const users = await prisma.user.findMany({
            include: { onlineStageCompletions: true },
        });
        return NextResponse.json(
            {
                message: "success",
                users: users.map((user) => ({
                    ...user,
                    completedOnlineStageIds: user.onlineStageCompletions.map((c) => c.stageId),
                })),
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

// project://src/app/context.tsx
export const POST = async (req: NextRequest) => {
    try {
        const { id, name } = await req.json();

        const user = await prisma.user.create({
            data: { id, name },
        });
        return NextResponse.json(
            {
                message: "success",
                user: { ...user, completedOnlineStageIds: [] },
            },
            { status: 201 },
        );
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
