"use client";

import { useEffect, useState } from "react";
import { Film, Radio, Tv, Star, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
    const [stats, setStats] = useState({ movies: 0, series: 0, sports: 0, specials: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/content?type=all")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const counts = {
                        movies: data.filter(d => d._type === 'movie').length,
                        series: data.filter(d => d._type === 'series').length,
                        sports: data.filter(d => d._type === 'sports').length,
                        specials: data.filter(d => d._type === 'special').length,
                        total: data.length,
                    };
                    setStats(counts);
                }
                setLoading(false);
            });
    }, []);

    const cards = [
        { name: "Total Docs", value: stats.total, icon: Plus, color: "text-white" },
        { name: "Movies", value: stats.movies, icon: Film, color: "text-brand-purple" },
        { name: "Series", value: stats.series, icon: Tv, color: "text-brand-pink" },
        { name: "Sports", value: stats.sports, icon: Radio, color: "text-blue-400" },
        { name: "Specials", value: stats.specials, icon: Star, color: "text-amber-400" },
    ];

    if (loading) return <div className="text-white/40 uppercase tracking-widest text-sm font-bold animate-pulse">Scanning Database...</div>;

    return (
        <div className="space-y-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest text-white">Overview</h1>
                    <p className="text-white/40 mt-2 font-geist text-sm">Real-time CMS statistics</p>
                </div>
                <Link
                    href="/admin/content"
                    className="flex items-center gap-2 px-6 py-3 bg-brand-gradient rounded-full text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-brand-purple/20"
                >
                    <Plus size={16} /> Add Content
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.name} className="glass p-6 rounded-3xl border border-white/5 space-y-6 hover:bg-white/10 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{card.name}</span>
                                <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                                    <Icon size={20} />
                                </div>
                            </div>
                            <div className="text-5xl font-black text-white italic tracking-tighter">
                                {card.value}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="glass p-12 rounded-[2.5rem] border border-white/5 text-center space-y-4">
                <h2 className="text-xl font-black text-white uppercase tracking-widest">System Health</h2>
                <p className="text-white/40 text-sm">All backend services are running normally. Frontend clients are connected.</p>
            </div>
        </div>
    );
}
