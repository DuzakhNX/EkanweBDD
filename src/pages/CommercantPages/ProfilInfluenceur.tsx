import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import sign from "../../assets/ekanwesign.png";
import Navbar from "./Navbar";

export default function Profilinfluenceur() {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

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
      alert("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur de mise à jour du profil :", error);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
      alert("Erreur de déconnexion.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] flex flex-col">
      <div className="flex items-center bg-white justify-between px-4 py-6">
        <h1 className="text-3xl text-[#1A2C24] font-bold">Mon Profil</h1>
        <img src={sign} alt="Ekanwe" className="w-6 h-6" />
      </div>

      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 mt-auto space-y-6 flex-1">
        <div className="flex flex-col items-center">
          <div className="relative cursor-pointer" onClick={handleImageClick}>
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-300">
              {profileImage ? (
                <img src={profileImage} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-300" />
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full opacity-0 hover:opacity-100 transition">
              <Camera className="text-white" size={24} />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-4 text-black">
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

        <button
          onClick={handleSave}
          className="w-full bg-[#1A2C24] text-white py-3 rounded-lg font-bold text-lg mt-6"
        >
          Sauvegarder
        </button>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-bold text-lg mt-4"
        >
          Déconnexion
        </button>
      </div>

      <Navbar />
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
      <label className="text-[#1A2C24] font-medium">{label}</label>
      <div className="flex items-center mt-1">
        {icon && <img src={icon} alt="icon" className="w-5 h-5 mr-2" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
        />
      </div>
    </div>
  );
}

function TextAreaField({ label, value, onChange }: InputProps) {
  return (
    <div>
      <label className="text-[#1A2C24] font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white mt-1"
      />
    </div>
  );
}
