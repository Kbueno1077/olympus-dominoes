import { createClient } from "@/utils/supabase/server";
import { Button } from "@mui/material";
import { redirect } from "next/navigation";
import AuthLink from "./AuthLink";

export default async function AuthButton() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const signOut = async () => {
        "use server";

        const supabase = createClient();
        await supabase.auth.signOut();
        return redirect("/");
    };

    return user ? (
        <div className="flex items-center gap-4 text-primary font-bold text-lg italic">
            <h2>Hey, {user.email}!</h2>
            <form action={signOut}>
                <Button variant="outlined" type="submit">
                    Logout
                </Button>
            </form>
        </div>
    ) : (
        <AuthLink />
    );
}
