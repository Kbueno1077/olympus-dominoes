"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "@mui/material";
import { useEffect, useState } from "react";

function FinishMatch({ finishMatch }: { finishMatch: () => void }) {
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

    return (
        <>
            {user && (
                <Button
                    onClick={finishMatch}
                    className="h-[60px] text-lg"
                    fullWidth
                    variant="contained"
                    disabled={true}
                >
                    Finish Match (Coming Soon)
                </Button>
            )}
        </>
    );
}

export default FinishMatch;
