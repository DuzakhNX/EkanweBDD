import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
// @ts-ignore
import { GeoSearchControl, OpenStreetMapProvider, SearchResult } from "leaflet-geosearch";

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

function SearchBox({
  setPosition,
  setLocationName,
}: {
  setPosition: (pos: any) => void
  setLocationName: (name: string) => void;
}) {
  const map = useMap();
  const provider = new OpenStreetMapProvider();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    const res = await provider.search({ query });
    setResults(res);

    if (res.length > 0) {
      const { lat, lon, display_name } = results[0];
      const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
      setPosition(newPos);
      setLocationName(display_name);
      map.setView(newPos, 14);
    } else {
      alert("Lieu introuvable");
    }
  };

  return (
    <>
      <div className="absolute top-2 right-1 z-[1000] bg-white p-3 rounded-lg shadow-lg w-72">
        <input
          type="text"
          placeholder="Rechercher une adresse..."
          className="w-full p-2 border rounded mb-2 bg-white text-black"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Rechercher
        </button>
        {results.length > 0 && (
          <ul className="mt-2 max-h-48 overflow-y-auto">
            {results.map((result, i) => (
              <li
                key={i}
                className="cursor-pointer hover:bg-gray-100 p-1"
                onClick={() => {
                  map.setView([result.y, result.x], 15);
                  setQuery(result.label);
                  setResults([]);
                  setPosition({ lat: result.y, lng: result.x });
                  setLocationName(result.label);
                }}
              >
                {result.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function UserLocation({
  setPosition,
  setLocationName,
}: {
  setPosition: (pos: any) => void;
  setLocationName: (name: string) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.locate({
      setView: true,
      maxZoom: 13,
    });

    map.on("locationfound", async (e) => {
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

      map.setView(e.latlng, 13);
    });
  }, [map, setPosition, setLocationName]);

  return null;
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
        center={[9.3077, 2.3158]}
        zoom={12}
        style={{ height: "75%", width: "75%" }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <UserLocation setPosition={setPosition} setLocationName={setLocationName} />
        <LocationPicker setPosition={setPosition} setLocationName={setLocationName} />
        <SearchBox setPosition={setPosition} setLocationName={setLocationName} />
        {position && (
          <Marker
            position={position}
            icon={L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>Position sélectionnée</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
