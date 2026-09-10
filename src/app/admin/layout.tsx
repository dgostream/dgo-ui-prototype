"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Film, Settings, LogOut } from "lucide-react";
import { cn } from "@/utils/cn";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Content", href: "/admin/content", icon: Film },
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    // Hide sidebar on the login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const handleLogout = () => {
        // Clear the cookie via a simple document.cookie replacement in frontend
        document.cookie = "admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/admin/login");
    };

    return (
        <div className="min-h-screen bg-black flex selection:bg-brand-purple/30 text-white font-geist">
            {/* Sidebar Navigation */}
            <aside className="w-64 glass-dark border-r border-white/5 flex flex-col justify-between sticky top-0 h-screen z-40">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-2 h-6 bg-brand-gradient rounded-full" />
                        <span className="text-xl font-black italic tracking-tighter uppercase">DGO ADMIN</span>
                    </div>

                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm tracking-widest uppercase",
                                        isActive
                                            ? "bg-brand-purple/20 text-brand-purple border border-brand-purple/30 shadow-[0_0_15px_rgba(138,63,252,0.1)]"
                                            : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
                                    )}
                                >
                                    <Icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-8 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-sm tracking-widest uppercase border border-transparent"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative bg-[#050505] pb-32">
                {/* Subtle Ambient Background */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-purple opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />

                <div className="p-12 relative z-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
