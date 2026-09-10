import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/lib/client";

export async function GET() {
    try {
        const query = `*[_type == "adSettings"][0]`;
        const data = await writeClient.fetch(query);
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { _id, _type, _createdAt, _updatedAt, ...fields } = body;

        let idToUpdate = _id;

        // If no adSettings doc exists, we must create one
        if (!idToUpdate) {
            const existing = await writeClient.fetch(`*[_type == "adSettings"][0]`);
            if (existing) {
                idToUpdate = existing._id;
            } else {
                const doc = { _type: "adSettings", ...fields };
                const response = await writeClient.create(doc);
                return NextResponse.json(response);
            }
        }

        const response = await writeClient.patch(idToUpdate).set(fields).commit();
        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
