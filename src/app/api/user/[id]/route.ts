import { PrismaClient, Prisma } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// project://src/app/context.tsx
export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = (await params).id;
        const user = await prisma.user.findFirst({
            where: { id },
            include: { onlineStageCompletions: true },
        });
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        const userWithIds = {
            ...user,
            completedOnlineStageIds: user.onlineStageCompletions.map((c) => c.stageId),
        };
        return NextResponse.json({ message: "success", user: userWithIds }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

// project://src/app/context.tsx
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = (await params).id;
        const { name, completedStageIds, completedOnlineStageIds } = await req.json();
        const data: Prisma.UserUpdateInput = {};
        if (name) {
            data.name = name;
        }
        if (completedStageIds) {
            data.completedStageIds = completedStageIds;
        }
        if (completedOnlineStageIds) {
            data.onlineStageCompletions = {
                deleteMany: {},
                create: completedOnlineStageIds.map((stageId: number) => ({ stageId })),
            };
        }
        const user = await prisma.user.update({
            data,
            where: { id },
            include: { onlineStageCompletions: true },
        });
        const userWithIds = {
            ...user,
            completedOnlineStageIds: user.onlineStageCompletions.map((c) => c.stageId),
        };
        return NextResponse.json({ message: "success", user: userWithIds }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

// project://src/app/context.tsx
export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = (await params).id;
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: "success" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
