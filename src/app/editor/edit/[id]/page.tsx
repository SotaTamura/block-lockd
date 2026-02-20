"use client";

import { useAuth, usePopup, useStage } from "@/app/context";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import StageEditor from "../../stageEditor";
import { StageType } from "@/constants";
import { Loading } from "@/app/components";

export default function EditStage({ params }: { params: Promise<{ id: string }> }) {
    const id = Number(use(params).id);
    const router = useRouter();
    const { user } = useAuth();
    const { showAlert } = usePopup();
    const { setStages, getStageById } = useStage();
    const [stageData, setStageData] = useState<StageType | null>(null);

    useEffect(() => {
        if (!user) {
            router.push("/");
            return;
        }
        (async () => {
            const stageFromContext = getStageById(id);
            if (stageFromContext && stageFromContext.code) {
                setStageData(stageFromContext);
            } else {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/stage/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setStageData(data.stage);
                        // Update context
                        if (data.stage) {
                            setStages((prevStages) => prevStages.map((s) => (s.id === id ? data.stage : s)));
                        }
                    } else {
                        router.push("/editor");
                    }
                } catch (error) {
                    showAlert(String(error));
                    router.push("/editor");
                }
            }
        })();
    }, [user, router, id, getStageById, setStages]);

    if (!stageData) {
        return <Loading />;
    }
    return <StageEditor initData={stageData} />;
}
