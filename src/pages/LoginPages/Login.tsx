import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUserData } from "../../context/UserContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    mail: "",
    motdepasse: "",
  });
  const [error, setError] = useState("");
  const { userData } = useUserData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
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
        if (role !== userData?.role) {
          alert('Vous n\'êtes pas un ' + role);
        } else if (data.inscription === "Non terminé") {
          navigate("/register");
        } else if (role === "commerçant") {
          navigate("/dealInfluenceur");
        } else if (role === "influenceur") {
          navigate("/deals");
        } else {
          setError("Rôle inconnu. Veuillez contacter l'administrateur.");
        }
      } else {
        setError("Compte introuvable dans la base de données.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Email ou mot de passe invalide.");
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
          >
            CONNEXION
          </button>
        </div>
      </div>
    </div>
  );
}
