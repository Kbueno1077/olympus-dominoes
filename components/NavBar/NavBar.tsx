import React from "react";
import AccountMenu from "../AccountMenu/AccountMenu";

function NavBar() {
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-4xl flex justify-end items-center p-3 text-sm">
                <AccountMenu />
            </div>
        </nav>
    );
}

export default NavBar;
