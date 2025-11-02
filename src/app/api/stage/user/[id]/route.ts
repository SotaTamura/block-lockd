import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const stages = await prisma.stage.findMany({
            where: {
                creatorId: Number((await params).id),
            },
        });
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
                    creatorName: creatorMap.get(stage.creatorId) || "Unknown",
                })),
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
