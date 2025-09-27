import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const path = (req.query.rest as string[]).join("/");
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/${path}`;
    const r = await fetch(url, {
        method: req.method,
        headers: { "content-type": "application/json" },
        body: ["GET", "HEAD"].includes(req.method || "") ? undefined : JSON.stringify(req.body),
    });
    const json = await r.json();
    res.status(r.status).json(json);
}
