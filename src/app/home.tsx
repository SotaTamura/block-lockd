"use client";

import { useAuth } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg } from "./components";
import { useEffect } from "react";

export default function Home({ id }: { id: string | undefined }) {
    const { user, loginBySession, logout } = useAuth();
    useEffect(() => {
        if (id && (!user || user.id !== id)) {
            loginBySession(id);
        }
    }, [id, loginBySession]);

    return (
        <div>
            {user ? (
                <div className="loginBtn">
                    <p>{user.name}</p>
                    <div onClick={logout} className="miniBtn">
                        ログアウト
                    </div>
                </div>
            ) : (
                <div className="flex my-5">
                    <Link href={"/auth/login"} className="miniBtn loginBtn">
                        ログイン
                    </Link>
                </div>
            )}
            <img src={"/logo.png"} className="mt-[20dvh] h-[24dvmin] m-auto" />
            <div className="w-[30dvh] h-[30dvh] m-auto flex flex-wrap mt-[10dvh]">
                <Link className="btn w-full h-1/2" href={"/select-stage"}>
                    <RightSvg />
                </Link>
                <Link href={user ? "/editor" : "/auth/login"} className="btn w-1/2 h-1/2">
                    <WrenchSvg />
                </Link>
                <Link href={"/select-online-stage"} className="btn w-1/2 h-1/2">
                    <WorldSvg />
                </Link>
            </div>
        </div>
    );
}
