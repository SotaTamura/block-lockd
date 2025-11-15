import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const stage = await prisma.stage.findFirst({ where: { id } });
        if (!stage) {
            return NextResponse.json({ message: "ステージが見つかりません" }, { status: 404 });
        }
        return NextResponse.json({ message: "success", stage: stage }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const { title, creatorId, description, code } = await req.json();
        const stage = await prisma.stage.update({
            data: { title, creatorId, description, code },
            where: { id },
        });
        return NextResponse.json({ message: "success", post: stage }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const stage = await prisma.stage.delete({ where: { id } });
        return NextResponse.json({ message: "success", stage: stage }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
