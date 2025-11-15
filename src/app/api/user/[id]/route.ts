import { PrismaClient } from "@/generated/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { UserType } from "@/constants";

const prisma = new PrismaClient();

export const GET = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const user = await prisma.user.findFirst({ where: { id } });
        if (!user) {
            return NextResponse.json({ message: "ユーザーが見つかりません" }, { status: 404 });
        }
        const { password, ...userWithoutPassword } = user;
        return NextResponse.json({ message: "success", user: userWithoutPassword }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const PUT = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const { name, password, completedStageIds } = await req.json();
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
        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }
        if (completedStageIds) {
            data.completedStageIds = completedStageIds;
        }
        const user = await prisma.user.update({
            data,
            where: { id },
        });
        return NextResponse.json({ message: "success", user: user }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};

export const DELETE = async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const id = Number((await params).id);
        const user = await prisma.user.delete({ where: { id } });
        return NextResponse.json({ message: "success", user: user }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "error", err }, { status: 500 });
    }
};
