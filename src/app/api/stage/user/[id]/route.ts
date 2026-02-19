import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const creatorId = (await params).id;
        const stages = await prisma.stage.findMany({
            where: {
                creatorId,
            },
            include: { creator: true },
        });
        return NextResponse.json(
            {
                message: "success",
                stages: stages.map((stage) => ({
                    ...stage,
                    creatorId: stage.creatorId || "",
                    creatorName: stage.creator?.name || "Unknown",
                })),
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
