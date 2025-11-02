"use client";

import { LeftSvg } from "@/app/components";
import { useAuth } from "@/app/context";
import { postLogin } from "@/app/fetch";
import Link from "next/link";
import React, { useRef } from "react";

export default function LoginPage() {
    const { login } = useAuth();
    const nameRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!nameRef.current?.value || !passwordRef.current?.value) {
            window.alert("ユーザー名とパスワードは必須です。");
        } else {
            const res = await postLogin({
                name: nameRef.current.value,
                password: passwordRef.current.value,
            });
            const data = await res.json();
            if (res.ok) {
                login(data.user);
            } else {
                window.alert(data.message);
            }
        }
    };

    return (
        <div className="backGround">
            <Link href="/" className="btn back">
                <LeftSvg />
            </Link>
            <div className="flex flex-col items-center justify-center h-4/5">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333]"
                    style={{
                        padding: "4dvmin",
                        borderWidth: "1dvmin",
                        width: "80dvmin",
                        maxWidth: "500px",
                    }}>
                    <h1 className="font-bold text-center" style={{ fontSize: "8dvmin", marginBottom: "3dvmin" }}>
                        ログイン
                    </h1>
                    <form className="flex flex-col items-center space-y-[2dvmin]" onSubmit={handleSubmit} style={{ fontSize: "2.5dvmin" }}>
                        <div className="w-full">
                            <label htmlFor="username" className="block" style={{ marginBottom: "1dvmin", fontSize: "4dvmin" }}>
                                ユーザー名
                            </label>
                            <input ref={nameRef} id="username" name="username" type="text" autoComplete="username" required className="w-full  border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]" style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }} />
                        </div>
                        <div className="w-full">
                            <label htmlFor="password" className="block" style={{ marginBottom: "1dvmin", fontSize: "4dvmin" }}>
                                パスワード
                            </label>
                            <input ref={passwordRef} id="password" name="password" type="password" autoComplete="current-password" required className="w-full  border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]" style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }} />
                        </div>
                        <button type="submit" className="miniBtn w-5/6 font-bold text-white bg-gray-600 hover:bg-gray-700" style={{ padding: "1.5dvmin", fontSize: "8dvmin", marginTop: "4dvmin" }}>
                            ログイン
                        </button>
                        <Link href="/auth/signup" className="block w-5/6">
                            <button type="button" className="miniBtn w-full font-bold text-white bg-gray-500 hover:bg-gray-600" style={{ padding: "1.5dvmin", fontSize: "4dvmin", marginTop: "2dvmin" }}>
                                新規アカウントを作成
                            </button>
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}
