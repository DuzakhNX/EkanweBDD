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
import "leaflet/dist/leaflet.css";
import LocationSelector from "../../components/LocationSelector";


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
  const [position, setPosition] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>("");

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
        locationName,
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
      <div className="relative w-full h-48">
        <img 
          src={imageBase64 || "https://via.placeholder.com/600x200"} 
          className="w-full h-full object-cover" 
          alt="Preview"
        />
        <label className="absolute bottom-2 right-2 bg-white/80 p-2 rounded-full cursor-pointer hover:bg-white/90 transition-all">
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          📸
        </label>
      </div>

      {/* Form */}
      <div className="p-4 flex flex-col gap-6">
        <div className="space-y-2">
          <label className="text-[#1A2C24] font-semibold text-lg">Titre du Deal</label>
          <textarea 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Entrez le titre de votre deal" 
            className="w-full border-2  border-gray-400 p-3 rounded-lg bg-white/10 focus:border-[#FF6B2E] focus:outline-none" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[#1A2C24] font-semibold text-lg">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Décrivez votre deal en détail" 
            className="w-full border-2  border-gray-400 p-3 rounded-lg bg-white/10 focus:border-[#FF6B2E] focus:outline-none min-h-[100px]" 
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <p className="text-[#1A2C24] font-semibold text-lg">Intérêts</p>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button 
                key={interest} 
                onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
                className={`px-4 py-2 border-2 rounded-full text-sm transition-colors duration-200 ${
                  selectedInterests.includes(interest) 
                    ? "bg-[#1A2C24] text-white border-[#1A2C24]" 
                    : "bg-white/10 border-gray-300 text-[#1A2C24] hover:border-[#FF6B2E]"
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[#1A2C24] font-semibold text-lg">Type de contenu</p>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button 
                key={type} 
                onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                className={`px-4 py-2 border-2 rounded-full text-sm transition-colors duration-200 ${
                  selectedTypes.includes(type) 
                    ? "bg-[#FF6B2E] text-white border-[#FF6B2E]" 
                    : "bg-white/10 border-gray-300 text-[#1A2C24] hover:border-[#FF6B2E]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[#1A2C24] font-semibold text-lg">Date de validité</label>
          <input 
            type="date" 
            value={validUntil || ""} 
            onChange={(e) => setValidUntil(e.target.value)} 
            className="w-full border-2 border-gray-400 p-3 rounded-lg bg-white/10 focus:border-[#FF6B2E] focus:outline-none" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[#1A2C24] font-semibold text-lg">Conditions</label>
          <textarea 
            value={conditions} 
            onChange={(e) => setConditions(e.target.value)} 
            placeholder="Décrivez les conditions de votre deal" 
            className="w-full border-2  border-gray-400 p-3 rounded-lg bg-white/10 focus:border-[#FF6B2E] focus:outline-none min-h-[100px]" 
          />
        </div>

        <div className="space-y-2">
          <p className="text-[#1A2C24] font-semibold text-lg">Localisation</p>
          <div className="h-64 w-full border-2 border-gray-400 rounded-lg overflow-hidden relative">
            <LocationSelector
              position={position}
              setPosition={setPosition}
              setLocationName={setLocationName}
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex mt-auto border-t  border-gray-400">
        <button 
          onClick={() => navigate(-1)} 
          className="w-1/2 py-4 bg-[#1A2C24] text-white font-semibold hover:bg-[#14210F] transition-colors duration-200"
        >
          RETOUR
        </button>
        <button 
          onClick={handleExecute} 
          disabled={isLoading} 
          className="w-1/2 py-4 bg-[#FF6B2E] text-white font-semibold hover:bg-[#e55a1f] transition-colors duration-200 disabled:bg-gray-400"
        >
          {isLoading ? "Traitement..." : "EXÉCUTER"}
        </button>
      </div>
    </div>
  );
}
