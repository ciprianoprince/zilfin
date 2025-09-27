import { S3Client } from "@aws-sdk/client-s3";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import dotenv from "dotenv";
import Fastify from "fastify";
import IORedis from "ioredis";

dotenv.config();

const prisma = new PrismaClient();
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
});

const indexerQueue = new Queue("indexer", { connection: redisConnection });

const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
});

const server = Fastify({ logger: true });
server.register(cors, { origin: true });

server.get("/health", async () => ({ ok: true }));

server.post("/listings", async (req, reply) => {
    const body = req.body as any;
    // Basic validation (expand with Zod)
    if (!body.title || !body.price || !body.lat || !body.lng) {
        return reply.status(400).send({ error: "missing fields" });
    }

    const listing = await prisma.listing.create({
        data: {
            title: body.title,
            description: body.description || "",
            price: Number(body.price),
            lat: Number(body.lat),
            lng: Number(body.lng),
            userId: body.userId,
        },
    });

    // enqueue indexing job
    await indexerQueue.add("index-listing", {
        listingId: listing.id,
    });

    return listing;
});

const start = async () => {
    try {
        await server.listen({ port: Number(process.env.PORT_API) || 4000, host: "0.0.0.0" });
        server.log.info(`API listening`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
