"use client";

import { useAuth, useStage } from "@/app/context";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import StageEditor from "../../stageEditor";
import { StageType } from "@/constants";
import { Loading } from "@/app/components";

export default function EditStage({ params }: { params: Promise<{ id: number }> }) {
    const id = Number(use(params).id);
    const router = useRouter();
    const { user } = useAuth();
    const { getStageById } = useStage();
    const [stageData, setStageData] = useState<StageType | null>(null);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
            return;
        }
        const stageFromContext = getStageById(id);
        if (stageFromContext) setStageData(stageFromContext);
    }, [user, router, id, getStageById]);

    if (!stageData) {
        return <Loading />;
    }
    return <StageEditor initData={stageData} />;
}
