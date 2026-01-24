import { createClient } from "../../lib/supabase/server";
import Home from "./home";

export default async function Session() {
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();

    return <Home id={data.user?.id} />;
}
