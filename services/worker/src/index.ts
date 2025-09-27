import dotenv from "dotenv";
dotenv.config();
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import Typesense from "typesense";

const prisma = new PrismaClient();
const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
});

const typesenseClient = new Typesense.Client({
    nodes: [
        {
            host: process.env.TYPESENSE_HOST || "localhost",
            port: Number(process.env.TYPESENSE_PORT || 8108),
            protocol: "http",
        },
    ],
    apiKey: process.env.TYPESENSE_API_KEY || "typesense_key",
    connectionTimeoutSeconds: 2,
});

const worker = new Worker("indexer", async (job) => {
    if (job.name === "index-listing") {
        const { listingId } = job.data as { listingId: string };
        const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            include: { images: true },
        });
        if (!listing) throw new Error("listing not found");

        const doc = {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price,
            lat: listing.lat,
            lng: listing.lng,
        };

        // Ensure a collection exists (one-time; production: create separately)
        try {
            await typesenseClient.collections("listings").retrieve();
        } catch {
            await typesenseClient.collections().create({
                name: "listings",
                fields: [
                    { name: "id", type: "string" },
                    { name: "title", type: "string" },
                    { name: "description", type: "string" },
                    { name: "price", type: "int32" },
                    { name: "lat", type: "float" },
                    { name: "lng", type: "float" },
                ],
                default_sorting_field: "price",
            });
        }

        // Upsert (Typesense doesn't have upsert; delete then index for simplicity)
        try {
            await typesenseClient.collections("listings").documents(listing.id).delete();
        } catch {}

        await typesenseClient.collections("listings").documents().create(doc);
        console.log(`Indexed listing ${listing.id}`);
    }
});

worker.on("completed", (job) => console.log("Job completed", job.id));
worker.on("failed", (job, err) => console.error("Job failed", job?.id, err));
