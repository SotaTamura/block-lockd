import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
    try {
        const limitParam = Number(req.nextUrl.searchParams.get("limit"));
        const offsetParam = Number(req.nextUrl.searchParams.get("offset"));
        const query = req.nextUrl.searchParams.get("query")?.trim() || "";
        const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), 50) : 10;
        const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? Math.floor(offsetParam) : 0;
        const stages = await prisma.stage.findMany({
            where: {
                access: 0,
                ...(query
                    ? {
                          OR: [{ title: { contains: query, mode: "insensitive" } }, { creator: { name: { contains: query, mode: "insensitive" } } }],
                      }
                    : {}),
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
