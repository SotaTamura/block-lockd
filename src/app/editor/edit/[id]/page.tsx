"use client";

import { useAuth } from "@/app/context";
import { getStage, throwError } from "@/app/fetch";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import StageEditor from "../../stageEditor";
import { StageType } from "@/constants";
import { Loading } from "@/app/components";

export default function EditStage({ params }: { params: Promise<{ id: number }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [stageData, setStageData] = useState<StageType | null>(null);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else {
            (async () => {
                try {
                    const data = await getStage(id);
                    if (!data) return;
                    if (data.creatorId !== user.id) {
                        router.push("/auth/login");
                        router.refresh();
                        return;
                    }
                    setStageData(data);
                } catch (err) {
                    throwError(err);
                }
            })();
        }
    }, [user, router, id]);

    if (!stageData) {
        return <Loading />; // Or some other loading indicator
    }

    return <StageEditor initData={stageData} />;
}
