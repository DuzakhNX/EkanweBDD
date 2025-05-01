import { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import sign from "../../assets/ekanwesign.png";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} icon={markerIcon} /> : null;
}

export default function MerchantDetailPageCommercant() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [conditions, setConditions] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<any>(null); // lat/lng

  const availableInterests = [
    "Mode", "Cuisine", "Voyage", "Beauté", "Sport", "Technologie", "Gaming",
    "Musique", "Cinéma", "Fitness", "Développement personnel", "Finance",
    "Photographie", "Lecture", "Art", "Éducation", "Animaux", "Nature", "Business"
  ];

  const availableTypes = [
    "Post Instagram", "Story Instagram", "Vidéo TikTok",
    "Vidéo Youtube", "Publication Facebook", "Autre"
  ];

  const toggleSelection = (
    value: string,
    selected: string[],
    setter: (v: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setter(selected.filter((item) => item !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecute = async () => {
    setError("");

    if (
      selectedInterests.length === 0 ||
      description.trim() === "" ||
      selectedTypes.length === 0 ||
      !validUntil ||
      !conditions ||
      !imageBase64 ||
      title.trim() === "" ||
      !position
    ) {
      setError("Veuillez remplir tous les champs et sélectionner un emplacement !");
      return;
    }

    setIsLoading(true);
    try {
      const dealRef = await addDoc(collection(db, "deals"), {
        description,
        title,
        interests: selectedInterests,
        typeOfContent: selectedTypes,
        validUntil,
        conditions,
        imageUrl: imageBase64,
        merchantId: auth.currentUser?.uid,
        status: "active",
        createdAt: serverTimestamp(),
        locationCoords: {
          lat: position.lat,
          lng: position.lng,
        },
        candidatures: [],
      });

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "influenceur"))
      );

      const batch = writeBatch(db);

      usersSnapshot.forEach((userDoc) => {
        const newNotifRef = doc(
          collection(db, "users", userDoc.id, "notifications")
        );
        batch.set(newNotifRef, {
          message: "Un nouveau deal est disponible !",
          type: "new_deal",
          fromUserId: auth.currentUser?.uid!,
          relatedDealId: dealRef.id,
          targetRoute: `/dealsseemoreinfluenceur/${dealRef.id}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
      navigate("/dealscommercant");
    } catch (error) {
      console.error("Erreur lors de la création du deal :", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <button onClick={() => navigate(-1)} className="text-orange-500">Retour</button>
        <img src={sign} className="w-6 h-6" onClick={() => navigate("/dealscommercant")} />
      </div>

      {/* Image Preview */}
      <div className="relative">
        <img src={imageBase64 || "https://via.placeholder.com/600x200"} className="w-full h-48 object-cover" />
        <label className="absolute bottom-2 right-2 bg-white p-1 rounded-full cursor-pointer">
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          📸
        </label>
      </div>

      {/* Form */}
      <div className="p-4 flex flex-col gap-4">
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className="border p-2 rounded bg-white" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="border p-2 rounded bg-white" />
        
        {/* Tags */}
        <div>
          <p className="font-medium mb-1">Intérêts</p>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button key={interest} onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
                className={`px-3 py-1 border rounded-full text-sm ${selectedInterests.includes(interest) ? "bg-[#1A2C24] text-white" : "bg-white border-gray-300"}`}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-medium mb-1">Type de contenu</p>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button key={type} onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                className={`px-3 py-1 border rounded-full text-sm ${selectedTypes.includes(type) ? "bg-[#FF6B2E] text-white" : "bg-white border-gray-300"}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <input type="date" value={validUntil || ""} onChange={(e) => setValidUntil(e.target.value)} className="border p-2 rounded bg-white" />

        {/* Conditions */}
        <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Conditions" className="border p-2 rounded bg-white" />

        {/* Map */}
        <div className="h-64 mt-4">
          <p className="font-medium mb-2">Sélectionnez une localisation</p>
          <MapContainer center={[14.6937, -17.4441]} zoom={12} className="h-full rounded overflow-hidden">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationPicker position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex mt-auto">
        <button onClick={() => navigate(-1)} className="w-1/2 py-4 bg-gray-600 text-white">RETOUR</button>
        <button onClick={handleExecute} disabled={isLoading} className="w-1/2 py-4 bg-[#FF6B2E] text-white">
          {isLoading ? "Traitement..." : "EXÉCUTER"}
        </button>
      </div>
    </div>
  );
}
