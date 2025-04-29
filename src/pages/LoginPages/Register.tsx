import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import { Facebook, Mail } from "lucide-react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";
import { useUserData } from "../../context/UserContext";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmation: "",
  });
  const { userData } = useUserData();

  const handleSubmit = async () => {
    const { email, password, confirmation } = formData;
    if (!email || !password || !confirmation) {
      alert("Tous les champs sont requis !");
      return;
    }

    if (password !== confirmation) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", cred.user.uid);
      const user = cred.user;
  
      await sendEmailVerification(user);

      await setDoc(userRef, {
        email: email,
        role: userData?.role || null,
        dateCreation: new Date(),
        inscription: "Non Terminé"
      });
      /*nom,
//       prenom,
//       pseudonyme,
//       dateNaissance,
//       phone: phone || null,
//       email: userRecord.email,
//       centresInteret: centresInteret || [],
//       social: {
//         instagram: instagram || null,
//         tiktok: tiktok || null
//       },
//       portfolio: portfolioUrls || [],
//       statutInscription: "en_attente",
//       role: role || "influenceur",
//       dateCreation: admin.firestore.FieldValue.serverTimestamp(),
//       verified: userRecord.emailVerified,
//       password */

      navigate("/validateinscription");
    } catch (err) {
      console.error("Erreur d'inscription :", err);
      alert("Une erreur est survenue : " + (err as any).message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://s3-alpha-sig.figma.com/img/766b/e8b9/25ea265fc6d5c0f04e3e93b27ecd65cb?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EsyWng5rz5MuEwYQEk01lU7LKsfv2EWoe-0bq8GtYOwvCr3abuoIOUk5UIU3it2DcnrX49Xu~~t-IdgxVen0GevBunbegAqHR-Jki-XrC1EnR84TWM8CrfsNvORud11qi3me9rQJIApdEysnnnPqTq4wtpdrQF9Tho0kRwj7r4IJOftLpWgG4ktpqP2iCobbbxs1KxnwQ7328NMqGPkUlWZ~TPbIg4oFsIzp8xDvk-c3TXJvy8UqR96LNu5zX1BNr~~VsdBcufw5AO8sOty0qgnylO6Lfr0dN-bWqe9zDc~e6PfZRxRupZ-t3vGrHT-KpU3Y0C~pK11-xCM4Tug1rw__')",
      }}
    >
      <div className="bg-[#1A2C24] bg-opacity-70 text-white px-4 py-6 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-2">Inscription</p>
          <h2 className="text-3xl font-bold mb-6">Créer un compte</h2>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <button className="flex items-center justify-center bg-white text-gray-800 px-4 py-2.5 rounded-md text-sm font-medium w-full">
            <Mail className="w-5 h-5 mr-2 text-red-500" />
            Continuer avec Google
          </button>
          <button className="flex items-center justify-center bg-[#1877F2] text-white px-4 py-2.5 rounded-md text-sm font-medium w-full">
            <Facebook className="w-5 h-5 mr-2" />
            Continuer avec Facebook
          </button>
        </div>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-500"></div>
          <span className="px-4 text-sm text-gray-400">ou</span>
          <div className="flex-1 border-t border-gray-500"></div>
        </div>

        <form className="flex flex-col gap-6">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Créer un mot de passe"
            onChange={handleChange}
            className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            name="confirmation"
            placeholder="Confirmer le mot de passe"
            onChange={handleChange}
            className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
          />
        </form>

        <div className="flex justify-between mt-8">
          <button
            className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
            onClick={() => navigate("/loginorsignup")}
          >
            RETOUR
          </button>
          <button
            className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
            onClick={handleSubmit}
          >
            S'INSCRIRE
          </button>
        </div>
      </div>
    </div>
  );
}