"use client";

import { useAuth } from "@/app/context";
import Link from "next/link";
import { WrenchSvg, RightSvg, WorldSvg } from "./components";

export default function Home() {
    const { user } = useAuth();

    return (
        <div>
            {user ? (
                <div className="loginBtn">
                    <p>{user.name}</p>
                    <Link href={"/auth/profile"} className="miniBtn">
                        アカウント管理
                    </Link>
                </div>
            ) : (
                <div className="flex my-5">
                    <Link href={"/auth/login"} className="miniBtn loginBtn">
                        ログイン
                    </Link>
                </div>
            )}
            <p className="mt-[30dvh] text-[length:12dvmin] m-auto whitespace-nowrap">Block Lockd</p>
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
