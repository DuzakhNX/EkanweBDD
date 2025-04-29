import { useState } from "react";
import { auth, db } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getDocs, query, where, writeBatch, doc } from "firebase/firestore";

export default function MerchantDetailPageCommercant() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [typeOfContent, setTypeOfContent] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [conditions, setConditions] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [error, setError] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const availableInterests = [
    "Mode", "Cuisine", "Voyage", "Beauté", "Sport", "Technologie", "Gaming",
    "Musique", "Cinéma", "Fitness", "Développement personnel", "Finance",
    "Photographie", "Lecture", "Art", "Éducation", "Animaux", "Nature", "Business"
  ];

  const availableTypes = [
    "Post Instagram", "Story Instagram", "Vidéo TikTok",
    "Vidéo Youtube", "Publication Facebook", "Autre"
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

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
    if (!selectedInterest || description.trim() === "" || !typeOfContent || !validUntil || !conditions || !imageBase64 || title.trim() === "") {
      setError("Veuillez remplir tous les champs !");
      return;
    }

    try {
      const dealRef = await addDoc(collection(db, "deals"), {
        description,
        title,
        interest: selectedInterest,
        typeOfContent,
        validUntil,
        conditions,
        imageUrl: imageBase64,
        merchantId: auth.currentUser?.uid,
        status: "active",
        createdAt: serverTimestamp(),
      });

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "influenceur"))
      );

      const batch = writeBatch(db);

      usersSnapshot.forEach((userDoc) => {
        const newNotifRef = doc(collection(db, "users", userDoc.id, "notifications"));
        batch.set(newNotifRef, {
          message: "Un nouveau deal est disponible !",
          type: "new_deal",
          fromUserId: auth.currentUser?.uid!,
          relatedDealId: dealRef.id,
          targetRoute: "/deals",
          read: false,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();

      navigate("/dealscommercant");
    } catch (error) {
      console.error("Erreur lors de la création du deal :", error);
      setError("Erreur lors de la création du deal, veuillez réessayer !");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5E7] text-[#14210F]">
      <div className="py-3 px-4 flex items-center border-b bg-[#F5F5E7] text-[#14210F]">
        <button onClick={handleGoBack} className="flex items-center text-orange-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Home</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="relative">
          <img
            src={imageBase64 || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0"}
            alt="Deal illustration"
            className={`w-full h-48 object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
          />
          <label className="absolute bottom-2 right-2 bg-white rounded-full p-1 cursor-pointer shadow-md">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </label>
        </div>

        <div className="p-4 bg-[#F5F5E7] text-[#1A2C24] border-b">
          <div className="flex justify-between items-center bg-[#F5F5E7] text-[#1A2C24]">
            <h1 className="text-xl font-bold">Proposer un deal</h1>
            <span className="text-orange-500">{auth.currentUser?.uid?.slice(0, 6) ?? "000000"}</span>
          </div>
        </div>

        <div className="p-4 bg-[#F5F5E7] text-[#1A2C24] border-b space-y-4">
          <div className="p-4 bg-[#F5F5E7] text-[#1A2C24] border-b">
          <div className="mb-4">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Titre</label>
              </div>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-[#F5F5E7] bg-white rounded-md p-2 text-sm"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Description</label>
                <button className="text-gray-500 text-sm">Edit</button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-[#F5F5E7] bg-white rounded-md p-2 text-sm"
                rows={2}
              />
            </div>

            <div className="mb-4 bg-[#F5F5E7] text-[#1A2C24]">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Intérêts</label>
                <button className="text-gray-500 text-sm">Edit</button>
              </div>
              <select
                value={selectedInterest ?? ""}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-md p-2 text-sm"
              >
                <option value="">Sélectionnez un intérêt</option>
                {availableInterests.map((interest) => (
                  <option key={interest} value={interest}>
                    {interest}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4 bg-[#F5F5E7] text-[#1A2C24]">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Type de Contenu</label>
              </div>
              <select
                value={typeOfContent ?? ""}
                onChange={(e) => setTypeOfContent(e.target.value)}
                className="w-full border border-gray-300 bg-white rounded-md p-2 text-sm mt-2"
              >
                <option value="">Sélectionnez un type</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4 bg-[#F5F5E7] text-[#1A2C24]">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Date de Validité</label>
              </div>
              <input
                type="date"
                value={validUntil ?? ""}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border bg-white border-gray-300 rounded-md p-2 text-sm mt-2"
              />
            </div>
            <div className="mb-4 bg-[#F5F5E7] text-[#1A2C24]">
              <div className="flex justify-between items-center mb-1 bg-[#F5F5E7] text-[#1A2C24]">
                <label className="font-medium">Conditions</label>
              </div>
              <textarea
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full border bg-white border-gray-300 rounded-md p-2 text-sm mt-2"
                rows={2}
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      <div className="w-full">
        <div className="flex">
          <button
            onClick={handleGoBack}
            className="flex-1 py-4 bg-gray-800 text-white font-bold text-center"
          >
            RETOUR
          </button>
          <button
            onClick={handleExecute}
            className="flex-1 py-4 bg-orange-500 text-white font-bold text-center"
          >
            EXÉCUTER
          </button>
        </div>
      </div>
    </div>
  );
}
