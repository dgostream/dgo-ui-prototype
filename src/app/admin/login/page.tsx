"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/admin");
                router.refresh(); // necessary for middleware & layout updates
            } else {
                alert("Invalid Password");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple blur-[150px] opacity-10 rounded-full pointer-events-none" />

            <div className="w-full max-w-sm glass-brand p-12 rounded-[2.5rem] flex flex-col items-center space-y-8 relative z-10 shadow-2xl">
                <div className="relative flex flex-col items-center space-y-6 w-full">
                    <div className="w-16 h-16 rounded-full bg-brand-purple/20 flex items-center justify-center border border-brand-purple/30 shadow-lg shadow-brand-purple/10">
                        <Lock size={32} className="text-brand-purple" />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-black text-white uppercase tracking-widest text-glow">Admin Portal</h1>
                        <p className="text-[10px] text-brand-purple/80 uppercase tracking-[0.2em] font-bold border border-brand-purple/30 px-3 py-1 rounded-full bg-brand-purple/5">Secure Access Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full space-y-6">
                        <div className="space-y-2">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Passcode..."
                                autoFocus
                                className="w-full bg-black/40 backdrop-blur border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 transition-all font-geist tracking-widest text-center shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-gradient py-4 rounded-2xl text-white font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-purple/20 disabled:scale-100 disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Access Dashboard"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
