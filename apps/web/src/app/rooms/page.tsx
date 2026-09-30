
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export default function RoomsRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/reservations/my");
    }, [router]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
