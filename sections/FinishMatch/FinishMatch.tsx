"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";

function FinishMatch() {
    const [user, setUser] = useState<any | null>(null);

    const loadUser = async () => {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    const finishMatch = () => {
        // if (!completedGames.length) {
        //     displayToast(`Empty match not allowed`, "error");
        //     return;
        // }
        // const settings = {
        //     matchDate: value,
        //     gameMode,
        //     maxPoints,
        //     playersAmount,
        //     playerslayout,
        //     matchDescription,
        // };
        // console.log(settings);
        // console.log(teamsLayout);
        // console.log(completedGames);
    };

    return (
        <>
            {user && (
                <Button
                    onClick={finishMatch}
                    className="h-[60px] text-lg"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={true}
                >
                    Finish Match (Coming Soon)
                </Button>
            )}
        </>
    );
}

export default FinishMatch;
