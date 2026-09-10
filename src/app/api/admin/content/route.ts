import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "movie";

        // Allow fetching all schema types if type='all'
        const query = type === 'all'
            ? `*[_type in ["movie", "series", "sports", "special", "content", "liveChannel", "heroCarousel", "sectionStack", "verticalSettings", "adSettings"]] | order(_createdAt desc) {
          _id, title, subtitle, tag, targetTab, _createdAt, _updatedAt, _type, vertical, tabId, isLive, currentProgram
        }`
            : `*[_type == $type] | order(_createdAt desc) {
          _id, title, subtitle, tag, targetTab, isLive, _createdAt, _updatedAt, _type, currentProgram, vertical, tabId
        }`;

        const data = await writeClient.fetch(query, { type });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const doc = {
            ...body,
            _type: body._type || 'movie',
        };
        const response = await writeClient.create(doc);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Content Creation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to create content" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { _id, _type, _createdAt, _updatedAt, ...fields } = body;
        if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 });

        const response = await writeClient.patch(_id).set(fields).commit();
        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await writeClient.delete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
    }
}
