import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import sign from "../../assets/ekanwesign.png";
import BottomNavbar from "./BottomNavbar";
import { takePicture, pickImage, configureStatusBar } from "../../utils/capacitorUtils";

export default function ProfilePageInfluenceur() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [pseudonyme, setPseudonyme] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<null | string>(null);
  const navigate = useNavigate();

  useEffect(() => {
    configureStatusBar();
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setPseudonyme(data.pseudonyme || "");
        setPrenom(data.prenom || "");
        setNom(data.nom || "");
        setPhone(data.phone || "");
        setDateNaissance(data.dateNaissance || "");
        setInstagram(data.instagram || "");
        setTiktok(data.tiktok || "");
        setPortfolioLink(data.portfolioLink || "");
        setBio(data.bio || "");
        setProfileImage(data.photoURL || null);
      }
    };

    fetchUserInfo();
  }, []);

  const handleImageClick = async () => {
    try {
      const imagePath = await takePicture();
      if (imagePath) {
        setProfileImage(imagePath);
      }
    } catch (error) {
      console.error("Erreur lors de la prise de photo:", error);
      setMessage("Erreur lors de la prise de photo");
    }
  };

  const handleGalleryClick = async () => {
    try {
      const imagePath = await pickImage();
      if (imagePath) {
        setProfileImage(imagePath);
      }
    } catch (error) {
      console.error("Erreur lors de la sélection de l'image:", error);
      setMessage("Erreur lors de la sélection de l'image");
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        pseudonyme,
        prenom,
        nom,
        phone,
        dateNaissance,
        instagram,
        tiktok,
        portfolioLink,
        bio,
        photoURL: profileImage || "",
      });

      setMessage("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur de mise à jour du profil :", error);
      setMessage("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      setMessage("Erreur de déconnexion.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7]">
      <div className="bg-white px-4 py-3 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
        <h1 className="text-2xl font-semibold text-[#1A2C24]">Mon Profil</h1>
        <img
          src={sign}
          alt="Ekanwe"
          className="w-8 h-8"
          onClick={async () => {
            const userRef = doc(db, "users", auth.currentUser?.uid || "");
            const snap = await getDoc(userRef);
            const role = snap.data()?.role;
            navigate(role === "influenceur" ? "/dealsinfluenceur" : "/dealscommercant");
          }}
        />
      </div>

      <div className="pt-16 pb-20 px-4 bg-[#F5F5E7] min-h-screen">
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#FF6B2E] relative">
                {profileImage ? (
                  <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FF6B2E]/10 flex items-center justify-center">
                    <Camera className="text-[#FF6B2E]" size={30} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={handleImageClick}
                    className="bg-[#FF6B2E] text-white p-2 rounded-full hover:bg-[#FF6B2E]/90 transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                  <button
                    onClick={handleGalleryClick}
                    className="bg-[#1A2C24] text-white p-2 rounded-full hover:bg-[#1A2C24]/90 transition-colors"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <InputField label="Pseudonyme" value={pseudonyme} onChange={setPseudonyme} />
            <InputField label="Prénom" value={prenom} onChange={setPrenom} />
            <InputField label="Nom" value={nom} onChange={setNom} />
            <InputField label="Date de Naissance" value={dateNaissance} onChange={setDateNaissance} type="date" />
            <InputField label="Téléphone" value={phone} onChange={setPhone} />
            <InputField label="Instagram" value={instagram} onChange={setInstagram} icon="/instagram.svg" />
            <InputField label="TikTok" value={tiktok} onChange={setTiktok} icon="/tiktok.svg" />
            <InputField label="Lien de Portfolio" value={portfolioLink} onChange={setPortfolioLink} />
            <TextAreaField label="Bio" value={bio} onChange={setBio} />
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
              message.includes("succès") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-medium mt-6 ${
              loading ? "bg-gray-400" : "bg-[#FF6B2E]"
            }`}
          >
            {loading ? "Sauvegarde..." : "Sauvegarder"}
          </button>

          <button
            onClick={handleLogout}
            className="w-full mt-3 py-3 rounded-xl border-2 border-[#1A2C24] text-[#1A2C24] font-medium hover:bg-red-50"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
}

interface InputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  icon?: string;
}

function InputField({ label, value, onChange, type = "text", icon }: InputProps) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <div className="flex items-center">
        {icon && <img src={icon} alt="icon" className="w-4 h-4 mr-2" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B2E] text-black"
        />
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FF6B2E] text-black"
      />
    </div>
  );
}
