"use client";

import { useEffect, useState } from "react";
import { Settings, Save, AlertCircle, UploadCloud, Film, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export default function AdSettingsManager() {
    const [settings, setSettings] = useState<any>({
        _type: 'adSettings',
        prerollVideo: null,
        midrollVideo: null,
        pauseAdImage: null,
        homeHeaderAd: { image: null, link: '', active: true },
        homeBackgroundAd: null,
        feedAd: { image: null, title: '', brand: '', link: '', active: true },
        sponsorLogo: null,
        footerBannerAd: null,
        matchHubBannerAd: null,
        overlayAd: null
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadStatus, setUploadStatus] = useState("");

    // Store raw files to be uploaded on save
    const [files, setFiles] = useState<Record<string, File | null>>({});

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setSettings((prev: any) => ({ ...prev, ...data }));
                }
                setLoading(false);
            });
    }, []);

    const uploadFile = async (file: File, type: "image" | "file") => {
        const data = new FormData();
        data.append("file", file);
        data.append("type", type);

        const res = await fetch("/api/admin/upload", {
            method: "POST",
            body: data
        });

        if (!res.ok) throw new Error(`Failed to upload ${type}`);
        return await res.json();
    };

    const handleFileChange = (key: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setUploadStatus("Initializing upload sequence...");

        try {
            const finalSettings = { ...settings };

            // Helper to handle nested object uploads safely
            const processUpload = async (fileKey: string, settingKey: string, type: "image" | "file", parentKey?: string) => {
                const file = files[fileKey];
                if (file) {
                    setUploadStatus(`Uploading ${file.name}...`);
                    const result = await uploadFile(file, type);
                    if (result.success) {
                        const assetRef = { _type: type, asset: { _type: "reference", _ref: result.assetId } };
                        if (parentKey) {
                            if (!finalSettings[parentKey]) finalSettings[parentKey] = {};
                            finalSettings[parentKey][settingKey] = assetRef;
                        } else {
                            finalSettings[settingKey] = assetRef;
                        }
                    }
                }
            };

            await processUpload("prerollVideo", "prerollVideo", "file");
            await processUpload("midrollVideo", "midrollVideo", "file");
            await processUpload("pauseAdImage", "pauseAdImage", "image");
            await processUpload("homeBackgroundAd", "homeBackgroundAd", "image");
            await processUpload("sponsorLogo", "sponsorLogo", "image");
            await processUpload("footerBannerAd", "footerBannerAd", "image");
            await processUpload("matchHubBannerAd", "matchHubBannerAd", "image");
            await processUpload("overlayAd", "overlayAd", "image");
            await processUpload("homeHeaderAd_image", "image", "image", "homeHeaderAd");
            await processUpload("feedAd_image", "image", "image", "feedAd");

            setUploadStatus("Saving configuration to database...");

            const res = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalSettings)
            });

            if (res.ok) {
                setSettings(finalSettings);
                setFiles({}); // Clear selected files
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings");
            }
        } catch (error: any) {
            alert(error.message || "An error occurred during save");
        } finally {
            setSaving(false);
            setUploadStatus("");
        }
    };

    if (loading) return <div className="text-white/40 uppercase tracking-widest text-sm font-bold animate-pulse">Loading Global Settings...</div>;

    const renderUploadField = (label: string, fileKey: string, accept: string, type: "image" | "video", existingRef?: string) => {
        const currentFile = files[fileKey];
        const Icon = type === 'video' ? Film : ImageIcon;
        const colorClass = type === 'video' ? 'brand-pink' : 'brand-purple';

        return (
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <Icon size={14} /> {label}
                </label>
                <div className="relative">
                    <input
                        type="file"
                        accept={accept}
                        disabled={saving}
                        onChange={e => handleFileChange(fileKey, e.target.files?.[0] || null)}
                        className="hidden"
                        id={`upload-${fileKey}`}
                    />
                    <label
                        htmlFor={`upload-${fileKey}`}
                        className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${currentFile
                                ? `border-${colorClass}/50 bg-${colorClass}/10 text-white`
                                : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10'
                            } ${saving ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <div className="flex flex-col gap-1 min-w-0 pr-4">
                            {currentFile ? (
                                <span className="text-sm font-bold truncate">{currentFile.name} (Ready)</span>
                            ) : (
                                <>
                                    <span className="text-xs font-bold uppercase tracking-widest">Select {type}</span>
                                    {existingRef && <span className="text-[10px] truncate opacity-50">Current: {existingRef}</span>}
                                </>
                            )}
                        </div>
                        <UploadCloud size={20} className="shrink-0" />
                    </label>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-widest text-white">Global Settings</h1>
                    <p className="text-white/40 mt-2 font-geist text-sm">Configure monetization and global platform variables</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Global Settings & Branding */}
                <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <Settings className="text-brand-purple" size={24} />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Branding & Overlays</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderUploadField("Home Background Takeover", "homeBackgroundAd", "image/*", "image", settings.homeBackgroundAd?.asset?._ref)}
                        {renderUploadField("Sponsor Logo (Live/Sports)", "sponsorLogo", "image/*", "image", settings.sponsorLogo?.asset?._ref)}
                        {renderUploadField("Footer Banner Ad", "footerBannerAd", "image/*", "image", settings.footerBannerAd?.asset?._ref)}
                        {renderUploadField("Match centre banner (4:1)", "matchHubBannerAd", "image/*", "image", settings.matchHubBannerAd?.asset?._ref)}
                        {renderUploadField("In-Stream Overlay Ad", "overlayAd", "image/*", "image", settings.overlayAd?.asset?._ref)}
                    </div>
                </div>

                {/* Video Ads */}
                <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-8">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <Film className="text-brand-pink" size={24} />
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Video Instream Ads</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {renderUploadField("Preroll Video", "prerollVideo", "video/*", "video", settings.prerollVideo?.asset?._ref)}
                        {renderUploadField("Midroll Video", "midrollVideo", "video/*", "video", settings.midrollVideo?.asset?._ref)}
                        {renderUploadField("Pause Ad Billboard", "pauseAdImage", "image/*", "image", settings.pauseAdImage?.asset?._ref)}
                    </div>
                </div>

                {/* Complex Objects (Header, Feed) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Home Header Ad */}
                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Home Header Banner</h2>
                        {renderUploadField("Header Image", "homeHeaderAd_image", "image/*", "image", settings.homeHeaderAd?.image?.asset?._ref)}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Link Destination URL</label>
                            <input
                                disabled={saving}
                                type="url"
                                value={settings.homeHeaderAd?.link || ''}
                                onChange={e => setSettings((s: any) => ({ ...s, homeHeaderAd: { ...s.homeHeaderAd, link: e.target.value } }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                placeholder="https://..."
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={saving}
                                checked={settings.homeHeaderAd?.active || false}
                                onChange={e => setSettings((s: any) => ({ ...s, homeHeaderAd: { ...s.homeHeaderAd, active: e.target.checked } }))}
                                className="w-4 h-4 rounded border-white/20 bg-black/40 text-brand-purple focus:ring-brand-purple"
                            />
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Active</span>
                        </label>
                    </div>

                    {/* Feed Ad */}
                    <div className="glass p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">In-Feed Native Ad</h2>
                        {renderUploadField("Feed Image", "feedAd_image", "image/*", "image", settings.feedAd?.image?.asset?._ref)}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Headline</label>
                                <input
                                    disabled={saving}
                                    type="text"
                                    value={settings.feedAd?.title || ''}
                                    onChange={e => setSettings((s: any) => ({ ...s, feedAd: { ...s.feedAd, title: e.target.value } }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                    placeholder="Ad Title"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Brand / Tag</label>
                                <input
                                    disabled={saving}
                                    type="text"
                                    value={settings.feedAd?.brand || ''}
                                    onChange={e => setSettings((s: any) => ({ ...s, feedAd: { ...s.feedAd, brand: e.target.value } }))}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                    placeholder="Sponsor Name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Link Destination URL</label>
                            <input
                                disabled={saving}
                                type="url"
                                value={settings.feedAd?.link || ''}
                                onChange={e => setSettings((s: any) => ({ ...s, feedAd: { ...s.feedAd, link: e.target.value } }))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-purple disabled:opacity-50"
                                placeholder="https://..."
                            />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={saving}
                                checked={settings.feedAd?.active || false}
                                onChange={e => setSettings((s: any) => ({ ...s, feedAd: { ...s.feedAd, active: e.target.checked } }))}
                                className="w-4 h-4 rounded border-white/20 bg-black/40 text-brand-purple focus:ring-brand-purple"
                            />
                            <span className="text-sm font-bold text-white uppercase tracking-widest">Active</span>
                        </label>
                    </div>
                </div>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-bold text-brand-pink animate-pulse">
                        {saving && uploadStatus}
                    </div>
                    <button disabled={saving} type="submit" className="px-8 py-4 bg-brand-gradient rounded-full text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-brand-purple/20 disabled:scale-100 disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center">
                        <Save size={16} /> {saving ? 'Uploading & Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}
