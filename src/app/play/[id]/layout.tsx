import { STAGES } from "@/game/stages";

export function generateStaticParams() {
    return Object.keys(STAGES).map((id) => ({
        id: id,
    }));
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
