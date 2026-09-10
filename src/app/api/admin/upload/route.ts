import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";

// Allow 5 minutes (max on Vercel Pro/Enterprise, 60s for Hobby) for uploads
export const maxDuration = 300; 

// Increase the body size limit for large file uploads in Next.js App Router
// In App Router, we export config but also need to handle the body streaming if bodyParser is false.
// Actually, App Router doesn't use `config.api.bodyParser`. It uses `NextRequest` which handles limits via the web server. 
// However, the development server might still enforce limits. We can try bypassing it by not using `request.formData()` directly if it's too large, but `request.formData()` is the standard way.

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const type = formData.get("type") as "image" | "file"; // 'image' or 'file' (for video)

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!type || (type !== 'image' && type !== 'file')) {
            return NextResponse.json({ error: "Invalid asset type" }, { status: 400 });
        }

        // Convert Web File to ArrayBuffer, then to Buffer for Sanity Client
        console.log(`Reading file to buffer...`);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Upload to Sanity
        console.log(`Starting Sanity upload for ${file.name} (${buffer.length} bytes) as ${type}`);
        const asset = await writeClient.assets.upload(type, buffer, {
            filename: file.name,
            contentType: file.type,
        });
        console.log(`Sanity upload successful: ${asset._id}`);

        return NextResponse.json({
            success: true,
            assetId: asset._id,
            url: asset.url
        });

    } catch (error: any) {
        console.error("Sanity Upload Error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
    }
}
