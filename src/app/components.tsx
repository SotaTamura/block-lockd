import { Dispatch, ReactNode, SetStateAction, useEffect, useState } from "react";
import { pressingEvent, pressStartEvent } from "../game/base";
import Link from "next/link";

export function ArrowButton({ eventName }: { eventName: "u" | "d" | "l" | "r" }) {
    const [active, setActive] = useState<"pressed" | "">("");
    const HandleTouchStart = () => {
        setActive("pressed");
        pressingEvent[eventName] = true;
        pressStartEvent[eventName] = true;
    };
    const HandleTouchEnd = (e: React.TouchEvent) => {
        setActive("");
        pressingEvent[eventName] = false;
        e.preventDefault();
    };
    useEffect(() => {});

    return (
        <>
            <div className={`btn arrow ${eventName} ${active}`} onTouchStart={HandleTouchStart} onTouchEnd={HandleTouchEnd}>
                {eventName === "u" && <UpSvg />}
                {eventName === "d" && <DownSvg />}
                {eventName === "l" && <LeftSvg />}
                {eventName === "r" && <RightSvg />}
            </div>
        </>
    );
}

export function Checkbox({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: () => void; children: ReactNode }) {
    return (
        <label htmlFor={id} className="guide">
            <input type="checkbox" name={id} id={id} checked={checked} onChange={onChange} />
            {children}
        </label>
    );
}

export function StageButton({ i, isCompleted }: { i: number; isCompleted: boolean }) {
    return (
        <Link href={`/game/${i}`} className={`btn stage ${isCompleted ? "completedBtn" : ""}`}>
            <div className="btnNum">{i}</div>
        </Link>
    );
}

export function RestartSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" id="_x32_" x="0" y="0" opacity="1" style={{ width: "32px", height: "32px" }} version="1.1" viewBox="0 0 512 512">
            <path fill="#4b4b4b" d="m389.618 88.15-54.668 78.072c6.58 4.631 12.713 9.726 18.366 15.396 25.042 25.057 40.342 59.202 40.374 97.38-.032 38.177-15.332 72.258-40.374 97.348-25.025 24.978-59.17 40.31-97.292 40.31a137.6 137.6 0 0 1-58.197-12.856 116 116 0 0 1-10.636-5.606c-3.514-1.996-6.868-4.184-10.094-6.452-6.596-4.6-12.728-9.758-18.446-15.396-24.978-25.089-40.31-59.17-40.31-97.348s15.332-72.323 40.31-97.38c16.689-16.657 37.435-28.986 60.751-35.383v41.068l92.534-93.636L219.403 0v48.854C108.105 66.454 23.046 162.74 23.03 278.998c.016 78.926 39.288 148.685 99.385 190.816a247 247 0 0 0 17.104 10.94c5.861 3.33 11.85 6.516 18.031 9.398 29.897 13.951 63.244 21.792 98.475 21.848 128.706-.08 232.93-104.304 232.946-233.002-.001-78.982-39.272-148.678-99.353-190.848"></path>
        </svg>
    );
}

export function MenuSvg() {
    return (
        <svg
            id="_x32_"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 512 512"
            style={{
                width: 32,
                height: 32,
                opacity: 1,
            }}
            xmlSpace="preserve">
            <style type="text/css">{"\n\t.st0{fill:#4B4B4B;}\n"}</style>
            <g>
                <rect
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={192}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={384}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    y={192}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={192}
                    y={192}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={384}
                    y={192}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    y={384}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={192}
                    y={384}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
                <rect
                    x={384}
                    y={384}
                    className="st0"
                    width={128}
                    height={128}
                    style={{
                        fill: "rgb(75, 75, 75)",
                    }}
                />
            </g>
        </svg>
    );
}
export function NextSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
            <title>{"\u30A2\u30BB\u30C3\u30C8 433"}</title>
            <polygon points="24 9 9 9 24 24 9 39 24 39 39 24 24 9" fill="rgb(75, 75, 75)" />
        </svg>
    );
}
export function UpSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
            <polygon points="24,9 9,39 39,39" fill="rgb(75, 75, 75)" />
        </svg>
    );
}
export function DownSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
            <polygon points="9,9 39,9 24,39" fill="rgb(75, 75, 75)" />
        </svg>
    );
}
export function LeftSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
            <polygon points="39,9 9,24 39,39" fill="rgb(75, 75, 75)" />
        </svg>
    );
}
export function RightSvg() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="32" height="32">
            <polygon points="9,9 39,24 9,39" fill="rgb(75, 75, 75)" />
        </svg>
    );
}
