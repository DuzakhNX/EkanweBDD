import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUserData } from "../../context/UserContext";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
//import { Mail } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    mail: "",
    motdepasse: "",
  });
  const [error, setError] = useState("");
  const { userData } = useUserData();
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const { role, inscription } = data;

        if (inscription === "Non Terminé") {
          setError("Inscription non terminée.");
          return;
        }

        if (role === "commerçant") {
          navigate("/dealscommercant");
        } else if (role === "influenceur") {
          navigate("/dealsinfluenceur");
        } else {
          setError("Rôle inconnu. Veuillez contacter l'administrateur.");
        }
      } else {
        setError("Compte inexistant. Veuillez vous inscrire d'abord.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erreur de connexion avec Google.");
    } finally {
      setLoading(false);
    }
  };


  const handleLogin = async () => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.mail,
        loginData.motdepasse
      );

      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const role = data.role;
        const inscription = data.inscription;

        if (role !== userData?.role) {
          alert('Vous n\'êtes pas un ' + role);
          return;
        }

        switch (inscription) {
          case "1":
            navigate("/registrationstepone");
            break;
          case "2":
            navigate("/intereststep");
            break;
          case "3":
            navigate("/socialconnectstep");
            break;
          case "4":
            navigate("/portfoliostep");
            break;
          case "terminé":
            if (role === "commerçant") {
              navigate("/dealscommercant");
            } else if (role === "influenceur") {
              navigate("/dealsinfluenceur");
            } else {
              setError("Rôle inconnu. Veuillez contacter l'administrateur.");
            }
            break;
          default:
            navigate("/loginorsignup");
        }

      } else {
        setError("Compte introuvable dans la base de données.");
      }

    } catch (err: any) {
      console.error(err);
      setError("Email ou mot de passe invalide.");
    } finally {
      setLoading(false);
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
        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-6">Bienvenue</p>
          <h2 className="text-3xl font-bold">Connexion</h2>
        </div>

        <form className="flex flex-col gap-8">
          <input
            type="email"
            name="mail"
            placeholder="Mail"
            onChange={handleChange}
            className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
          />
          <input
            type="password"
            name="motdepasse"
            placeholder="Mot de passe"
            onChange={handleChange}
            className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm"
          />
        </form>

        <div className="text-right mb-4">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-gray-300 text-xs hover:text-white transition-colors duration-200"
          >
            Mot de passe oublié ?
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}

        <div className="flex justify-between mt-6">
          <button
            className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
            onClick={() => navigate("/connection")}
          >
            RETOUR
          </button>
          <button
            className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Connexion..." : "CONNEXION"}
          </button>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1A2C24] text-gray-400">Ou continuer avec</span>
            </div>
          </div>

          <button
            className="w-full mt-4 flex items-center justify-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            {loading ? "Connexion..." : "Continuer avec Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
