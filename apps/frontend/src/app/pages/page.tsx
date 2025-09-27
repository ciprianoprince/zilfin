import { useEffect, useState } from "react";

type Listing = {
    id: string;
    title: string;
    price: number;
};

export default function Home() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState(1000);

    useEffect(() => {
        fetch("/api/proxy/listings")
            .then((r) => r.json())
            .then(setListings);
    }, []);

    const create = async () => {
        await fetch("/api/proxy/listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, price, lat: 14.6, lng: 121.0 }),
        });
        setTitle("");
        setPrice(1000);
        const res = await fetch("/api/proxy/listings");
        setListings(await res.json());
    };

    return (
        <div style={{ padding: 24 }}>
            <h1>Listings</h1>
            <div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" />
                <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                <button onClick={create}>Create</button>
            </div>
            <ul>
                {listings.map((l) => (
                    <li key={l.id}>
                        {l.title} • ${l.price}
                    </li>
                ))}
            </ul>
        </div>
    );
}
