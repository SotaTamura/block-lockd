import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async () => {
    try {
        const stages = await prisma.stage.findMany({
            where: { access: 0 },
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

export const POST = async (req: NextRequest) => {
    try {
        const { title, creatorId, description, code, access } = await req.json();
        const stage = await prisma.stage.create({
            data: { title, creatorId, description, code, access },
        });
        return NextResponse.json({ message: "success", stage: stage }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
