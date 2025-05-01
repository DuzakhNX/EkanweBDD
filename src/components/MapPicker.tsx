import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";

const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function MapPicker({ onSelect }: { onSelect: (coords: { lat: number, lng: number }) => void }) {
    const [position, setPosition] = useState<{ lat: number, lng: number } | null>(null);

    useMapEvents({
        click(e) {
            const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPosition(coords);
            onSelect(coords);
        }
    });

    return (
        <MapContainer center={[14.6937, -17.4441] as [number, number]}
            zoom={13}
            className="h-full rounded overflow-hidden">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
        </MapContainer>
    );
}
