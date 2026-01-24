"use client";

import { LeftSvg, Loading } from "@/app/components";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { useAuth } from "@/app/context";

export default function LoginPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const nameRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const name = nameRef.current?.value;
        const password = passwordRef.current?.value;
        if (!name || !password) {
            window.alert("ユーザー名とパスワードは必須です。");
        } else {
            setIsLoading(true);
            login(name, password);
            setIsLoading(false);
        }
    };
    return (
        <div>
            {isLoading && <Loading />}
            <Link href="/" className="btn back">
                <LeftSvg />
            </Link>
            <div className="flex flex-col items-center grow overflow-y-auto py-10">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333]"
                    style={{
                        padding: "4dvmin",
                        borderWidth: "1dvmin",
                        width: "min(90vw, 500px)",
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
                            <input
                                ref={nameRef}
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="w-full  border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                                style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="password" className="block" style={{ marginBottom: "1dvmin", fontSize: "4dvmin" }}>
                                パスワード
                            </label>
                            <input
                                ref={passwordRef}
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="w-full  border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                                style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                            />
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
