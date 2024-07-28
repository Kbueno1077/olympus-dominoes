import NavBar from "@/components/NavBar/NavBar";
import AddPlayer from "@/modules/AddPlayer/AddPlayer";
import AllPlayers from "@/modules/AllPlayers/AllPlayers";
import { createClient } from "@/utils/supabase/server";
import { Container } from "@mui/material";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: playerData } = await supabase.from("players").select("*");
    console.log("🚀 ~ ProtectedPage ~ data:", playerData);

    if (!user) {
        return redirect("/login");
    }

    return (
        <div className="flex-1 w-full flex flex-col items-center">
            <div className="w-full">
                <div className="py-6 font-bold bg-purple-950 text-center text-white">
                    This is a protected page that you can only see as an
                    authenticated user
                </div>

                <NavBar />
            </div>

            <div className="w-full">
                <Container>
                    <div
                        style={{
                            paddingTop: "40px",
                            paddingBottom: "40px",
                        }}
                    >
                        <AddPlayer />
                    </div>
                </Container>

                <Container>
                    <AllPlayers data={playerData ?? []} />
                </Container>
            </div>

            <footer className="w-full border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
                <p>
                    Powered by{" "}
                    <a
                        href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                        target="_blank"
                        className="font-bold hover:underline"
                        rel="noreferrer"
                    >
                        Supabase
                    </a>
                </p>
            </footer>
        </div>
    );
}
