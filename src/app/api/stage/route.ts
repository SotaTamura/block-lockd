import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest) => {
    try {
        const stages = await prisma.stage.findMany();
        const creatorIds = stages.map((stage) => stage.creatorId);
        const creators = await prisma.user.findMany({
            where: {
                id: {
                    in: creatorIds,
                },
            },
        });
        const creatorMap = new Map(creators.map((creator) => [creator.id, creator.name]));
        return NextResponse.json(
            {
                message: "success",
                stages: stages.map((stage) => ({
                    ...stage,
                    creatorName: creatorMap.get(stage.creatorId) || "不明",
                })),
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const { title, creatorId, description, code } = await req.json();
        const stage = await prisma.stage.create({
            data: { title, creatorId, description, code },
        });
        return NextResponse.json({ message: "success", stage: stage }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
