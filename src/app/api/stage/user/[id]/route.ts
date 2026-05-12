import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const limitParam = Number(_req.nextUrl.searchParams.get("limit"));
        const offsetParam = Number(_req.nextUrl.searchParams.get("offset"));
        const query = _req.nextUrl.searchParams.get("query")?.trim() || "";
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 50) : 10;
        const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.floor(offsetParam) : 0;
        const creatorId = (await params).id;
        const stages = await prisma.stage.findMany({
            where: {
                creatorId,
                ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
            },
            orderBy: { createdAt: "desc" },
            skip: offset,
            take: limit + 1,
            select: {
                id: true,
                title: true,
                creatorId: true,
                createdAt: true,
                updatedAt: true,
                access: true,
                creator: true,
            },
        });
        const hasMore = stages.length > limit;
        const currentStages = hasMore ? stages.slice(0, limit) : stages;
        return NextResponse.json(
            {
                message: "success",
                stages: currentStages.map((stage) => ({
                    ...stage,
                    creatorId: stage.creatorId || "",
                    creatorName: stage.creator?.name || "Unknown",
                })),
                hasMore,
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const creatorId = (await params).id;
        const result = await prisma.stage.deleteMany({
            where: {
                creatorId,
                access: { not: 0 },
            },
        });
        return NextResponse.json({ message: "success", count: result.count }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "error", error }, { status: 500 });
    }
};
