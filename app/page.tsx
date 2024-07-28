import NewMatch from "@/modules/NewMatch/newMatch";
import { createClient } from "@/utils/supabase/server";
import { Container } from "@mui/material";
import AuthButton from "../components/AuthButton/AuthButton";
import { redirect } from "next/navigation";

export default async function Index() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        return redirect("/protected");
    }

    return (
        <div className="flex-1 w-full flex flex-col items-center">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-4xl flex justify-end items-center p-3 text-sm">
                    <AuthButton />
                </div>
            </nav>

            <div className="px-2">
                <div className="flex-1 flex flex-col gap-6">
                    <Container maxWidth="xl" sx={{ padding: "0" }}>
                        <div
                            style={{
                                paddingTop: "10px",
                                paddingBottom: "40px",
                            }}
                        >
                            <NewMatch />
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
}
