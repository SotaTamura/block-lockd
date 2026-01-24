import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import { UserType } from "@/constants";

const prisma = new PrismaClient();

// project://src/app/context.tsx
export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = (await params).id;
        const user = await prisma.user.findFirst({ where: { id } });
        if (!user) {
            return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
        }
        return NextResponse.json({ message: "success", user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

// project://src/app/context.tsx
export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = (await params).id;
        const { name, completedStageIds, completedOnlineStageIds } = await req.json();
        const data: Partial<UserType> = {};
        if (name) {
            // Check if user already exists
            if (
                await prisma.user.findFirst({
                    where: { name },
                })
            ) {
                return NextResponse.json({ message: "このユーザー名は既に使用されています" }, { status: 409 });
            }
            data.name = name;
        }
        if (completedStageIds) {
            data.completedStageIds = completedStageIds;
        }
        if (completedOnlineStageIds) {
            data.completedOnlineStageIds = completedOnlineStageIds;
        }
        const user = await prisma.user.update({
            data,
            where: { id },
        });
        return NextResponse.json({ message: "success", user: user }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
