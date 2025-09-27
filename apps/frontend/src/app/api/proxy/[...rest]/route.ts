import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { rest: string[] } }) {
    return handleRequest(request, params.rest, "GET");
}

export async function POST(request: NextRequest, { params }: { params: { rest: string[] } }) {
    return handleRequest(request, params.rest, "POST");
}

export async function PUT(request: NextRequest, { params }: { params: { rest: string[] } }) {
    return handleRequest(request, params.rest, "PUT");
}

export async function DELETE(request: NextRequest, { params }: { params: { rest: string[] } }) {
    return handleRequest(request, params.rest, "DELETE");
}

export async function PATCH(request: NextRequest, { params }: { params: { rest: string[] } }) {
    return handleRequest(request, params.rest, "PATCH");
}

async function handleRequest(request: NextRequest, rest: string[], method: string) {
    const path = rest.join("/");
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/${path}`;

    let body: string | undefined = undefined;
    if (!["GET", "HEAD"].includes(method)) {
        try {
            const requestBody = await request.json();
            body = JSON.stringify(requestBody);
        } catch {
            // No body or invalid JSON, continue without body
        }
    }

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "content-type": "application/json",
                ...Object.fromEntries(request.headers.entries()),
            },
            body,
        });

        const json = await response.json();
        return NextResponse.json(json, { status: response.status });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
    }
}
