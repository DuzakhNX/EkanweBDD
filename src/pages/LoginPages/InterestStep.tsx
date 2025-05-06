import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../../assets/ekanwe-logo.png";
import { auth, db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { usePrefillUserData } from "../../hooks/usePrefillUserData";

export default function InterestsStep() {
  const navigate = useNavigate();
  const [customInput, setCustomInput] = useState("");
  const baseTags = [
    "Mode", "Cuisine", "Voyage", "Beauté", "Sport", "Technologie", "Gaming",
    "Musique", "Cinéma", "Fitness", "Développement personnel", "Finance",
    "Photographie", "Lecture", "Art", "Éducation", "Animaux", "Nature", "Business"
  ];
  
  const suggestions: Record<string, string[]> = {
    "Mode": ["Vintage", "Haute couture", "Streetwear", "Accessoires", "Shoes", "Fashion Week"],
    "Cuisine": ["Street food", "Vegan", "Desserts", "Plats africains", "Recettes rapides", "Cuisine du monde", "Healthy"],
    "Voyage": ["Afrique", "Europe", "Asie", "Roadtrip", "Aventures", "Destinations insolites", "Travel vlog"],
    "Gaming": ["Esport", "Indie Games", "Streaming", "Jeux mobile", "MMORPG", "Jeux de stratégie", "Rétrogaming"],
    "Sport": ["Football", "Basketball", "Yoga", "Boxe", "Danse", "Cyclisme", "Musculation", "Arts martiaux"],
    "Beauté": ["Soins du visage", "Make-up", "Routine", "Produits naturels", "Coiffure", "Parfums"],
    "Musique": ["Afrobeats", "Rap", "Jazz", "DJing", "Production musicale", "Gospel", "Pop", "Rock"],
    "Cinéma": ["Films africains", "Netflix", "Séries", "Critique ciné", "Documentaires", "Acteurs", "Animation"],
    "Fitness": ["HIIT", "Cardio", "Entraînement maison", "Plan nutrition", "Transformation physique", "Fitness challenges"],
    "Développement personnel": ["Motivation", "Gestion du temps", "Productivité", "Mindset", "Lecture utile", "Spiritualité"],
    "Finance": ["Crypto", "Investissement", "Épargne", "Comptabilité", "Finance perso", "Bourse", "Budgeting"],
    "Photographie": ["Portrait", "Paysage", "Édition photo", "Matériel", "Mobile photography", "Inspiration visuelle"],
    "Lecture": ["Romans", "Mangas", "Livres business", "Développement perso", "Fantasy", "Policiers", "Poésie"],
    "Art": ["Dessin", "Peinture", "Graffiti", "Sculpture", "Art numérique", "Expositions", "Art africain"],
    "Éducation": ["Astuce d'étude", "Méthodes d'apprentissage", "Préparation d'examens", "Orientation", "Cours en ligne", "Tutoring"],
    "Animaux": ["Chiens", "Chats", "Animaux exotiques", "Adoption", "Dressage", "Soins vétérinaires"],
    "Nature": ["Randonnée", "Écologie", "Plantes", "Forêts", "Paysages", "Nature urbaine", "Camping"],
    "Business": ["Entrepreneuriat", "Marketing digital", "E-commerce", "Branding", "Stratégie", "Startups", "Networking"],
    "Technologie": ["IA", "Startups tech", "Applications", "Innovation", "Mobile", "Web", "Gadgets"]
  };
  const [availableTags, setAvailableTags] = useState<string[]>([...baseTags]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPrefilled, setIsPrefilled] = useState(false);

  usePrefillUserData(["interets"], (data) => {
    if (!isPrefilled) {
      setSelectedTags(data.interets || []);
      setIsPrefilled(true);
    }
  });

  const toggleTag = (tag: string) => {
    const isSelected = selectedTags.includes(tag);

    if (isSelected) {
      setSelectedTags(prev => prev.filter(t => t !== tag));

      if (suggestions[tag]) {
        setAvailableTags(prev =>
          prev.filter(t => !suggestions[tag].includes(t))
        );
      }
    } else {
      setSelectedTags(prev => [...prev, tag]);

      if (suggestions[tag]) {
        setAvailableTags(prev => {
          const newTags = suggestions[tag].filter(s => !prev.includes(s));
          return [...prev, ...newTags];
        });
      }
    }
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Utilisateur non connecté.");
  
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        interets: selectedTags,
        inscription: "3"
      });
      navigate("/socialconnectstep");
    } catch (err) {
      console.error("Erreur d'enregistrement :", err);
      alert("Échec lors de l'enregistrement des centres d'intérêt.");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://s3-alpha-sig.figma.com/img/766b/e8b9/25ea265fc6d5c0f04e3e93b27ecd65cb?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EsyWng5rz5MuEwYQEk01lU7LKsfv2EWoe-0bq8GtYOwvCr3abuoIOUk5UIU3it2DcnrX49Xu~~t-IdgxVen0GevBunbegAqHR-Jki-XrC1EnR84TWM8CrfsNvORud11qi3me9rQJIApdEysnnnPqTq4wtpdrQF9Tho0kRwj7r4IJOftLpWgG4ktpqP2iCobbbxs1KxnwQ7328NMqGPkUlWZ~TPbIg4oFsIzp8xDvk-c3TXJvy8UqR96LNu5zX1BNr~~VsdBcufw5AO8sOty0qgnylO6Lfr0dN-bWqe9zDc~e6PfZRxRupZ-t3vGrHT-KpU3Y0C~pK11-xCM4Tug1rw__')",
      }}
    >
      <div className="bg-[#1A2C24] bg-opacity-l70 text-white px-4 py-4 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-sm text-right">2/4</div>

        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-6">Inscription</p>
          <h2 className="text-3xl font-bold">Centre d'intérêt</h2>
          <div className="mb-4 text-sm text-gray-300 text-center">
            Tu ne vois pas ce que tu cherches ?{" "}
            <span className="text-white font-semibold">
              Ajoute ton propre centre d'intérêt
            </span>
          </div>
          <div className="mb-6">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Rechercher ou ajouter un centre d’intérêt"
              className="w-full px-4 py-2 text-sm rounded-md bg-transparent border border-white text-white placeholder:text-gray-300"
            />
            {customInput && !availableTags.includes(customInput) && (
              <button
                onClick={() => {
                  setAvailableTags((prev) => [...prev, customInput]);
                  setSelectedTags((prev) => [...prev, customInput]);
                  setCustomInput("");
                }}
                className="mt-2 text-sm text-amber-400 underline"
              >
                Ajouter "{customInput}" comme centre d’intérêt
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {availableTags.map((tag, index) => (
            <button
              key={index}
              onClick={() => toggleTag(tag)}
              className={`py-2 px-4 rounded-lg text-sm border transition ${
                selectedTags.includes(tag)
                  ? "bg-[#FF6B2E] text-ekanwe-dark font-semibold"
                  : "border-white text-white"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-20">
          <button
            className="border border-white text-white px-6 py-2 rounded-lg text-sm"
            onClick={() => navigate("/registerstepone")}
          >
            RETOUR
          </button>
          <button
            className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
            onClick={handleSubmit}
          >
            SUIVANT
          </button>
        </div>
      </div>
    </div>
  );
}
