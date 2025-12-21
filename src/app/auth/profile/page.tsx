"use client";

import { LeftSvg } from "@/app/components";
import { useAuth } from "@/app/context";
import { deleteUser, postLogin, putUser } from "@/app/fetch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function Profile() {
    const { user, logout, changeUserData } = useAuth();
    const router = useRouter();
    const newNameRef = useRef<HTMLInputElement | null>(null);
    const currentPasswordRef = useRef<HTMLInputElement | null>(null);
    const newPasswordRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else {
            if (newNameRef.current) {
                newNameRef.current.value = user.name;
            }
        }
    });

    const handleChangeName = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!newNameRef.current?.value) {
            window.alert("新しい名前を入力してください。");
        } else {
            changeUserData({ name: newNameRef.current.value });
            window.alert("名前を変更しました。");
        }
    };

    const handleChangePassword = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) {
            router.push("/auth/login");
            router.refresh();
        } else if (!currentPasswordRef.current?.value) {
            window.alert("現在のパスワードを入力してください。");
        } else if (!newPasswordRef.current?.value) {
            window.alert("新しいパスワードを入力してください。");
        } else {
            const res = await postLogin({
                name: user.name,
                password: currentPasswordRef.current.value,
            });
            if (res.ok) {
                const res = await putUser({
                    id: user.id,
                    password: newPasswordRef.current.value,
                });
                if (res.ok) {
                    window.alert("パスワードを変更しました。");
                    if (currentPasswordRef.current) currentPasswordRef.current.value = "";
                    if (newPasswordRef.current) newPasswordRef.current.value = "";
                } else {
                    window.alert("パスワードの変更に失敗しました。");
                }
            } else {
                window.alert("現在のパスワードが正しくありません。");
            }
        }
    };

    const handleDeleteUser = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (user && window.confirm("本当にアカウントを削除しますか？")) {
            const res = await deleteUser(user.id);
            if (res.ok) {
                window.alert("アカウントを削除しました。");
                logout();
            } else {
                const data = await res.json();
                window.alert(data.message);
            }
        }
    };

    return (
        <div className="backGround">
            <Link href="/" className="btn back">
                <LeftSvg />
            </Link>
            <div className="flex flex-col items-center h-full">
                <div
                    className="bg-[#aaa] bg-opacity-75 border-[#333] flex flex-col items-center space-y-[2dvmin]"
                    style={{
                        padding: "4dvmin",
                        borderWidth: "1dvmin",
                        width: "80dvmin",
                        maxWidth: "500px",
                    }}>
                    <button onClick={logout} className="miniBtn font-bold text-white bg-gray-500 hover:bg-gray-600 w-3/5" style={{ padding: "1.5dvmin", fontSize: "4dvmin" }}>
                        ログアウト
                    </button>
                    <div className="w-full">
                        <label htmlFor="username" className="block text-left" style={{ fontSize: "4dvmin" }}>
                            ユーザー名
                        </label>
                        <div className="flex items-center space-x-[2dvmin]">
                            <input
                                ref={newNameRef}
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="w-full border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                                style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                            />
                            <button onClick={handleChangeName} className="miniBtn font-bold text-white bg-gray-600 hover:bg-gray-700 w-1/3" style={{ fontSize: "4dvmin" }}>
                                更新
                            </button>
                        </div>
                    </div>

                    <div className="w-full">
                        <div className="font-bold text-left" style={{ fontSize: "4dvmin" }}>
                            パスワード変更
                        </div>
                        <label htmlFor="current-password" className="block text-left" style={{ fontSize: "3dvmin" }}>
                            現在のパスワード
                        </label>
                        <input
                            ref={currentPasswordRef}
                            id="current-password"
                            name="current-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                            style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                        />
                        <label htmlFor="new-password" className="block text-left" style={{ fontSize: "3dvmin", marginTop: "1dvmin" }}>
                            新しいパスワード
                        </label>
                        <input
                            ref={newPasswordRef}
                            id="new-password"
                            name="new-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="w-full border-gray-600 focus:outline-none focus:border-blue-500 bg-white text-[16px]"
                            style={{ padding: "1.5dvmin", borderWidth: "0.2dvmin", color: "black" }}
                        />
                        <div className="flex justify-end">
                            <button onClick={handleChangePassword} className="miniBtn w-1/5 font-bold text-white bg-gray-600 hover:bg-gray-700" style={{ fontSize: "4dvmin", marginTop: "2dvmin" }}>
                                更新
                            </button>
                        </div>
                    </div>

                    <div className="w-full flex justify-around pt-[4dvmin]">
                        <button onClick={handleDeleteUser} className="miniBtn font-bold text-white bg-red-600 hover:bg-red-700 w-3/5" style={{ fontSize: "4dvmin" }}>
                            アカウント削除
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
