"use client";

import { useAuth } from "@/app/context";
import Link from "next/link";
import { RightSvg } from "./components";

export default function Home() {
    const { user, logout } = useAuth();

    return (
        <div className="homeScreen backGround">
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
            <p className="title">Cube Escape</p>
            <Link className="btn start" href={"/select-stage"}>
                <RightSvg />
            </Link>
            {/* <div className="flex my-5">
                <Link href={user ? "/editor" : "/auth/login"} className=" text-center rounded-md p-2 m-auto bg-slate-300 font-semibold">
                    作成
                </Link>
            </div>
            <div className="flex my-5">
                <Link href={"/online-stages"} className=" text-center rounded-md p-2 m-auto bg-slate-300 font-semibold">
                    オンラインステージ
                </Link>
            </div> */}
        </div>
    );
}
