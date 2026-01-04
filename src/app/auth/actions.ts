"use server";

import { createClient } from "../../../lib/supabase/server";

export const signInAnonymously = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
        return { error: error.message };
    }

    return { data, error: null };
};
