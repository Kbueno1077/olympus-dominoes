"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";
import useToast from "@/hooks/useToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { gameModeRecoil, player1Recoil } from "@/recoil/recoilState";

function FinishMatch() {
    const [user, setUser] = useState<any | null>(null);
    const gameMode = useRecoilValue(gameModeRecoil);
    const player1 = useRecoilValue(player1Recoil);

    const displayToast = useToast();

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

    const finishMatch = async () => {
        const supabase = createClient();

        //Try Catch, or other handling

        displayToast(
            `More than 1 Team has more or equal amount of points than the Max allowed \n
     or the input value has errors`,
            "error"
        );
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
