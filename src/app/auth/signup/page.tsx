"use client";

import { LeftSvg, Loading } from "@/app/components";
import { useAuth } from "@/app/context";
import { postUser, throwError } from "@/app/fetch";
import Link from "next/link";
import React, { useRef, useState } from "react";

export default function SignupPage() {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const nameRef = useRef<HTMLInputElement | null>(null);
    const passwordRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nameRef.current?.value || !passwordRef.current?.value) {
            window.alert("ユーザー名とパスワードは必須です。");
        } else {
            setIsLoading(true);
            try {
                const res = await postUser({ name: nameRef.current.value, password: passwordRef.current.value });
                const data = await res.json();
                if (res.ok) {
                    login(data.user);
                } else {
                    alert(data.message);
                }
            } catch (err) {
                throwError(err);
            }
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isLoading && <Loading />}
            <Link href="/" className="btn back">
                <LeftSvg />
            </Link>
            <div className="flex flex-col items-center justify-center h-4/5">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333] mt-10"
                    style={{
                        padding: "4dvmin",
                        borderWidth: "1dvmin",
                        width: "80dvmin",
                        maxWidth: "500px",
                    }}>
                    <h1 className="font-bold text-center" style={{ fontSize: "8dvmin", marginBottom: "3dvmin" }}>
                        新規登録
                    </h1>
                    <form className="flex flex-col items-center space-y-[2dvmin]" onSubmit={handleSubmit} style={{ fontSize: "2.5dvmin" }}>
                        <div className="w-full">
                            <label htmlFor="name" className="block" style={{ marginBottom: "1dvmin", fontSize: "4dvmin" }}>
                                ユーザー名
                            </label>
                            <input
                                ref={nameRef}
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
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
                                required
                                className="w-full border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                                style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                            />
                        </div>
                        <button type="submit" className="miniBtn w-5/6 font-bold text-white bg-gray-600 hover:bg-gray-700" style={{ padding: "1.5dvmin", fontSize: "8dvmin", marginTop: "4dvmin" }}>
                            登録
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
