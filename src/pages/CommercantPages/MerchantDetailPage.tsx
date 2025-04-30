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
  getDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import sign from "../../assets/ekanwesign.png";

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGoBack = () => navigate(-1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setImageLoaded(false);
        setTimeout(() => setImageLoaded(true), 50);
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
      title.trim() === ""
    ) {
      setError("Veuillez remplir tous les champs !");
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
        candidatures: []
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
    <div className="flex flex-col min-h-screen bg-[#F5F5E7] text-[#14210F]">
      <div className="py-3 px-4 flex items-center justify-between border-b">
        <button onClick={handleGoBack} className="flex items-center text-orange-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Retour
        </button>
        <img
          src={sign}
          alt="Ekanwe"
          className="w-6 h-6"
          onClick={async () => {
            const userRef = doc(db, "users", auth.currentUser?.uid || "");
            const snap = await getDoc(userRef);
            const role = snap.data()?.role;
            navigate(role === "influenceur" ? "/dealsinfluenceur" : "/dealscommercant");
          }}
        />
      </div>

      <div className="relative">
        <img
          src={imageBase64 || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0"}
          alt="Illustration"
          className={`w-full h-48 object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <label className="absolute bottom-2 right-2 bg-white rounded-full p-1 cursor-pointer shadow-md">
          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </label>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="font-medium">Titre</label>
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border bg-white rounded-md p-2 text-sm" rows={2} />
        </div>

        <div>
          <label className="font-medium">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border bg-white rounded-md p-2 text-sm" rows={3} />
        </div>

        <div>
          <label className="font-medium mb-1 block">Intérêts</label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
                className={`px-3 py-1 rounded-full text-sm border ${selectedInterests.includes(interest)
                  ? "bg-[#1A2C24] text-white"
                  : "bg-white border-gray-300"}`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-medium mb-1 block">Type de Contenu</label>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                className={`px-3 py-1 rounded-full text-sm border ${selectedTypes.includes(type)
                  ? "bg-[#FF6B2E] text-white"
                  : "bg-white border-gray-300"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="font-medium">Date de Validité</label>
          <input type="date" value={validUntil ?? ""} onChange={(e) => setValidUntil(e.target.value)} className="w-full border bg-white border-gray-300 rounded-md p-2 text-sm mt-2" />
        </div>

        <div>
          <label className="font-medium">Conditions</label>
          <textarea value={conditions} onChange={(e) => setConditions(e.target.value)} className="w-full border bg-white border-gray-300 rounded-md p-2 text-sm mt-2" rows={2} />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="mt-auto">
        <div className="flex">
          <button onClick={handleGoBack} className="flex-1 py-4 bg-gray-800 text-white font-bold text-center">
            RETOUR
          </button>
          <button
            onClick={handleExecute}
            disabled={isLoading}
            className={`flex-1 py-4 font-bold text-center ${isLoading ? "bg-gray-400 text-white" : "bg-orange-500 text-white"}`}
          >
            {isLoading ? "Traitement..." : "EXÉCUTER"}
          </button>
        </div>
      </div>
    </div>
  );
}
