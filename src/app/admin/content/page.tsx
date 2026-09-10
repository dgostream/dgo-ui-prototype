"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, X, UploadCloud, Film, Image as ImageIcon } from "lucide-react";

export default function ContentManager() {
    const [content, setContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Tab State
    const [activeTab, setActiveTab] = useState<"all" | "movie" | "series" | "sports" | "special" | "content" | "liveChannel" | "heroCarousel" | "sectionStack" | "verticalSettings" | "adSettings">("all");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState({
        _type: 'movie', title: '', subtitle: '', desc: '', tag: '', targetTab: 'entertainment',
        year: '', rating: '', duration: '', price: '', isPPV: false, director: '', cast: '', genres: ''
    });

    // Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const [heroVideoFile, setHeroVideoFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");

    const fetchContent = () => {
        setLoading(true);
        fetch("/api/admin/content?type=all")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setContent(data);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleOpenModal = (item?: any) => {
        setUploadStatus("");
        setImageFile(null);
        setHeroImageFile(null);
        setHeroVideoFile(null);
        setVideoFile(null);

        if (item) {
            setEditingItem(item);
            setFormData({
                _type: item._type || activeTab,
                title: item.title || '',
                subtitle: item.subtitle || '',
                desc: item.desc || '',
                tag: item.tag || '',
                targetTab: item.targetTab || 'entertainment',
                year: item.year || '',
                rating: item.rating || '',
                duration: item.duration || '',
                price: item.price || '',
                isPPV: item.isPPV || false,
                director: item.director || '',
                cast: Array.isArray(item.cast) ? item.cast.join(', ') : '',
                genres: Array.isArray(item.genres) ? item.genres.join(', ') : ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                _type: activeTab, title: '', subtitle: '', desc: '', tag: '', targetTab: 'entertainment',
                year: '', rating: '', duration: '', price: '', isPPV: false, director: '', cast: '', genres: ''
            });
        }
        setIsModalOpen(true);
    };

    const uploadFile = async (file: File, type: "image" | "file") => {
        const data = new FormData();
        data.append("file", file);
        data.append("type", type);

        const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: data
        });

        // Check response ok
        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(`Failed to upload ${type}: ${errData?.error || res.statusText}`);
        }
        return await res.json();
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setUploadStatus("Initializing...");

        try {
            const finalData: any = { ...formData };
            // Ensure boolean types
            finalData.isPPV = Boolean(finalData.isPPV);
            finalData.isJunior = Boolean(finalData.isJunior);
            finalData.isHero = Boolean(finalData.isHero);
            if (typeof finalData.cast === 'string') {
                finalData.cast = finalData.cast.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            if (typeof finalData.genres === 'string') {
                finalData.genres = finalData.genres.split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            // Generate slug automatically if not present
            if (!finalData.slug && finalData.title) {
                finalData.slug = {
                    _type: 'slug',
                    current: finalData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
                };
            }

            // 1. Upload Image (if provided)
            if (imageFile) {
                setUploadStatus("Uploading Cover Art...");
                const imgResult = await uploadFile(imageFile, "image");
                if (imgResult.success) {
                    finalData.img = { _type: "image", asset: { _type: "reference", _ref: imgResult.assetId } };
                }
            }

            // Upload Hero Image (if provided)
            if (heroImageFile) {
                setUploadStatus("Uploading Hero Image...");
                const heroImgResult = await uploadFile(heroImageFile, "image");
                if (heroImgResult.success) {
                    finalData.heroImg = { _type: "image", asset: { _type: "reference", _ref: heroImgResult.assetId } };
                }
            }

            // 2. Upload Video (if provided)
            if (videoFile) {
                setUploadStatus("Uploading Video Source (This may take a minute)...");
                const vidResult = await uploadFile(videoFile, "file");
                if (vidResult.success) {
                    finalData.video = { _type: "file", asset: { _type: "reference", _ref: vidResult.assetId } };
                }
            }

            // Upload Hero Video (if provided)
            if (heroVideoFile) {
                setUploadStatus("Uploading Hero Video (This may take a minute)...");
                const heroVidResult = await uploadFile(heroVideoFile, "file");
                if (heroVidResult.success) {
                    finalData.heroVideo = { _type: "file", asset: { _type: "reference", _ref: heroVidResult.assetId } };
                }
            }

            setUploadStatus("Saving Record...");

            const isEdit = !!editingItem;
            const url = "/api/admin/content";
            const method = isEdit ? "PUT" : "POST";
            const body = isEdit ? { _id: editingItem._id, ...finalData } : finalData;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchContent();
            } else {
                const errData = await res.json().catch(() => null);
                alert(`Failed to save content record: ${errData?.error || res.statusText}`);
            }
        } catch (error: any) {
            alert(error.message || "An error occurred during save");
        } finally {
            setSaving(false);
            setUploadStatus("");
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            const res = await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchContent();
            } else {
                alert("Failed to delete content");
            }
        }
    };

    const tabs = [
        { id: "all", label: "All" },
        { id: "movie", label: "Movies" },
        { id: "series", label: "Series" },
        { id: "sports", label: "Sports" },
        { id: "special", label: "Specials" },
        { id: "liveChannel", label: "Live Channels" },
        { id: "content", label: "Legacy Content" },
        { id: "heroCarousel", label: "Hero Carousel" },
        { id: "sectionStack", label: "Section Stack" },
        { id: "verticalSettings", label: "Vertical Settings" },
        { id: "adSettings", label: "Ad Settings" }
    ] as const;

    const filtered = content
        .filter(c => activeTab === "all" ? true : c._type === activeTab)
        .filter(c =>
            String(c.title || "").toLowerCase().includes(search.toLowerCase()) ||
            String(c.tag || "").toLowerCase().includes(search.toLowerCase()) ||
            String(c._type || "").toLowerCase().includes(search.toLowerCase()) ||
            String(c.targetTab || c.vertical || c.tabId || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest text-white">Content Library</h1>
                    <p className="text-white/40 mt-2 font-geist text-sm">Manage dynamic platform catalog</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/50 w-64 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg whitespace-nowrap"
                    >
                        <Plus size={16} /> New Asset
                    </button>
                </div>
            </div>

            {/* Vertical Segment Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs transition-all ${activeTab === tab.id
                            ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30 shadow-[0_0_15px_rgba(138,63,252,0.1)]'
                            : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass flex-1 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-white/40 uppercase tracking-widest text-sm font-bold animate-pulse">Loading Catalog...</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Title</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Type</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Tag / Tab</th>
                                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-geist">
                                {filtered.map((item) => (
                                    <tr key={item._id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-6 font-bold text-white max-w-xs truncate">
                                            {item.title || item._type || "Untitled"} <br />
                                            <span className="text-white/40 text-xs font-normal">{item.subtitle}</span>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-white/10 text-white text-[10px] rounded uppercase tracking-widest font-black">
                                                {item._type}
                                            </span>
                                        </td>
                                        <td className="p-6 text-white/60">
                                            {item.tag || '--'} / {item.targetTab || item.vertical || item.tabId || '--'}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(item)} className="p-2 glass rounded-lg text-white/60 hover:text-white transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item._id, item.title)} className="p-2 glass rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-white/20 uppercase tracking-widest font-bold text-sm">
                                            No content found in this vertical
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <div className="relative w-full max-w-3xl glass-dark rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/10 my-auto">
                        <button
                            onClick={() => !saving && setIsModalOpen(false)}
                            disabled={saving}
                            className="absolute top-8 right-8 p-2 glass rounded-full text-white/40 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-8 text-glow">
                            {editingItem ? 'Edit Asset' : 'New Asset'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-8">

                            {/* Metadata Section */}
                            <div className="space-y-6">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm border-b border-white/10 pb-2">Core Metadata</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Content Type</label>
                                        <select
                                            disabled={saving || !!editingItem} // changing types post-creation in Sanity can be messy
                                            value={formData._type}
                                            onChange={e => setFormData({ ...formData, _type: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                        >
                                            <option value="movie">Movie</option>
                                            <option value="series">Series</option>
                                            <option value="sports">Sports</option>
                                            <option value="special">Special</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Target Tab</label>
                                        <select
                                            disabled={saving}
                                            value={formData.targetTab}
                                            onChange={e => setFormData({ ...formData, targetTab: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                        >
                                            <option value="entertainment">Entertainment</option>
                                            <option value="sports">Sports</option>
                                            <option value="junior">Junior</option>
                                            <option value="specials">Specials</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Title</label>
                                    <input
                                        required
                                        disabled={saving}
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                        placeholder="e.g. Masterpiece 2026"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Subtitle</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.subtitle}
                                            onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="e.g. Official Trailer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tag</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.tag}
                                            onChange={e => setFormData({ ...formData, tag: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="e.g. Action / Drama"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Description</label>
                                    <textarea
                                        disabled={saving}
                                        rows={4}
                                        value={formData.desc}
                                        onChange={e => setFormData({ ...formData, desc: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50 resize-none"
                                        placeholder="e.g. In a world where AI writes code..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Year</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.year}
                                            onChange={e => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="2026"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Rating</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.rating}
                                            onChange={e => setFormData({ ...formData, rating: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="TV-MA"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Duration</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="1h 45m"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Price</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="$0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Director</label>
                                        <input
                                            disabled={saving}
                                            type="text"
                                            value={formData.director}
                                            onChange={e => setFormData({ ...formData, director: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                            placeholder="Director Name"
                                        />
                                    </div>
                                    <div className="space-y-2 flex items-center pt-8">
                                        <label className="flex items-center gap-3 cursor-pointer text-white text-sm">
                                            <input
                                                disabled={saving}
                                                type="checkbox"
                                                checked={formData.isPPV}
                                                onChange={e => setFormData({ ...formData, isPPV: e.target.checked })}
                                                className="w-5 h-5 rounded border-white/10 bg-black/40 text-brand-purple focus:ring-brand-purple focus:ring-offset-brand-secondary"
                                            />
                                            Is Pay-Per-View (PPV)
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Cast (Comma Separated)</label>
                                        <textarea
                                            disabled={saving}
                                            rows={2}
                                            value={formData.cast}
                                            onChange={e => setFormData({ ...formData, cast: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50 resize-none"
                                            placeholder="Actor 1, Actor 2"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Genres (Comma Separated)</label>
                                        <textarea
                                            disabled={saving}
                                            rows={2}
                                            value={formData.genres}
                                            onChange={e => setFormData({ ...formData, genres: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50 resize-none"
                                            placeholder="Action, Thriller, Drama"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Media Assets Section */}
                            <div className="space-y-6 pt-4">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm border-b border-white/10 pb-2">Media Assets</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Image Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                            <ImageIcon size={14} /> Cover Art (Image)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={saving}
                                                onChange={e => setImageFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="upload-image"
                                            />
                                            <label
                                                htmlFor="upload-image"
                                                className={`flex items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${imageFile ? 'border-brand-purple/50 bg-brand-purple/10 text-white' : 'border-white/10 bg-white/5 text-white/40 hover:border-brand-purple/30 hover:bg-white/10'} ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {imageFile ? (
                                                    <span className="text-sm font-bold truncate max-w-[200px]">{imageFile.name} (Ready)</span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud size={24} />
                                                        <span className="text-xs font-bold uppercase tracking-widest mt-2 hover:text-white">Select Image</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Video Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                            <Film size={14} /> Source (Video)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="video/*"
                                                disabled={saving}
                                                onChange={e => setVideoFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="upload-video"
                                            />
                                            <label
                                                htmlFor="upload-video"
                                                className={`flex items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${videoFile ? 'border-brand-pink/50 bg-brand-pink/10 text-white' : 'border-white/10 bg-white/5 text-white/40 hover:border-brand-pink/30 hover:bg-white/10'} ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {videoFile ? (
                                                    <span className="text-sm font-bold truncate max-w-[200px]">{videoFile.name} (Ready)</span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud size={24} />
                                                        <span className="text-xs font-bold uppercase tracking-widest mt-2 hover:text-white">Select Video</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    {/* Hero Image Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                            <ImageIcon size={14} /> Hero Image (Carousel)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={saving}
                                                onChange={e => setHeroImageFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="upload-hero-image"
                                            />
                                            <label
                                                htmlFor="upload-hero-image"
                                                className={`flex items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${heroImageFile ? 'border-brand-purple/50 bg-brand-purple/10 text-white' : 'border-white/10 bg-white/5 text-white/40 hover:border-brand-purple/30 hover:bg-white/10'} ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {heroImageFile ? (
                                                    <span className="text-sm font-bold truncate max-w-[200px]">{heroImageFile.name} (Ready)</span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud size={24} />
                                                        <span className="text-xs font-bold uppercase tracking-widest mt-2 hover:text-white">Select Hero Image</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Hero Video Field */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                                            <Film size={14} /> Hero Video (Carousel Loop)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="video/*"
                                                disabled={saving}
                                                onChange={e => setHeroVideoFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="upload-hero-video"
                                            />
                                            <label
                                                htmlFor="upload-hero-video"
                                                className={`flex items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all text-center ${heroVideoFile ? 'border-brand-pink/50 bg-brand-pink/10 text-white' : 'border-white/10 bg-white/5 text-white/40 hover:border-brand-pink/30 hover:bg-white/10'} ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {heroVideoFile ? (
                                                    <span className="text-sm font-bold truncate max-w-[200px]">{heroVideoFile.name} (Ready)</span>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <UploadCloud size={24} />
                                                        <span className="text-xs font-bold uppercase tracking-widest mt-2 hover:text-white">Select Hero Video</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions & Status */}
                            <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
                                <div className="text-sm font-bold text-brand-pink animate-pulse">
                                    {saving && uploadStatus}
                                </div>
                                <div className="flex justify-end gap-4 w-full md:w-auto">
                                    <button disabled={saving} type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-full text-white/60 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors disabled:opacity-50">
                                        Cancel
                                    </button>
                                    <button disabled={saving} type="submit" className="px-8 py-3 bg-brand-gradient rounded-full text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-brand-purple/20 disabled:scale-100 disabled:opacity-50 disabled:cursor-wait">
                                        {saving ? 'Processing...' : 'Save & Upload Asset'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }
        </div >
    );
}
