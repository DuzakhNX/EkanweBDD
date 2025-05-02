import { useRef, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
// @ts-ignore
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";

export function SearchControl({ setPosition }: { setPosition: (coords: any) => void }) {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        // @ts-ignore
        const searchControl = new GeoSearchControl({
            provider,
            style: "bar",
            autoClose: true,
            keepResult: false,
        });

        map.addControl(searchControl);

        map.on("geosearch/showlocation", (result: any) => {
            setPosition(result.location); // met à jour lat/lng
        });

        return () => {
            map.removeControl(searchControl);
        };
    }, [map, setPosition]);

    return null;
}

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function LocationPicker({ setPosition, setLocationName }: any) {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );
                const data = await res.json();
                setLocationName(data.display_name || "");
            } catch (err) {
                console.error("Erreur reverse geocoding :", err);
            }
        },
    });
    return null;
}

function MapSearch({
    setPosition,
    setLocationName,
}: {
    setPosition: (pos: any) => void;
    setLocationName: (name: string) => void;
}) {
    const [query, setQuery] = useState("");
    const map = useMap();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    query
                )}`
            );
            const results = await res.json();
            if (results.length > 0) {
                const { lat, lon, display_name } = results[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setPosition(newPos);
                setLocationName(display_name);
                map.setView(newPos, 14);
            } else {
                alert("Lieu introuvable");
            }
        } catch (err) {
            console.error("Erreur lors de la recherche :", err);
        }
    };

    return (
        <div className="mb-3 px-2">
            <div className="flex">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher un lieu (ex: Dakar, Sénégal)"
                    className="flex-1 border border-gray-300 rounded-l px-3 py-2 text-sm"
                />
                <button
                    onClick={handleSearch}
                    className="bg-[#FF6B2E] text-white px-4 rounded-r text-sm"
                >
                    Rechercher
                </button>
            </div>
        </div>
    );
}

export default function LocationSelector({
    position,
    setPosition,
    setLocationName,
}: {
    position: any;
    setPosition: (pos: any) => void;
    setLocationName: (name: string) => void;
}) {
    return (
        <div className="rounded-lg overflow-hidden border mt-2" style={{ height: "300px" }}>
            <MapContainer
                center={[14.6937, -17.4441]}
                zoom={12}
                style={{ height: "100%", width: "100%" }}
                className="rounded-lg"
            >
                <SearchControl setPosition={setPosition} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker setPosition={setPosition} setLocationName={setLocationName} />
                <MapSearch setPosition={setPosition} setLocationName={setLocationName} />
                {position && <Marker position={position} icon={markerIcon} />}
            </MapContainer>
        </div>
    );
}
