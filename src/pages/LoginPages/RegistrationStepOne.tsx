import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ekanwe-logo.png";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

export default function RegistrationStepOne() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: "",
    prenoms: "",
    naissance: "",
    telephone: "",
    pseudo: "",
  });
  const [pseudoError, setPseudoError] = useState("");
  const [isCheckingPseudo, setIsCheckingPseudo] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const checkPseudoUnique = async (pseudo: string) => {
    setIsCheckingPseudo(true);
    const q = query(collection(db, "users"), where("pseudonyme", "==", pseudo));
    const querySnapshot = await getDocs(q);
    const isTaken = !querySnapshot.empty;

    if (isTaken) {
      setPseudoError("Ce pseudonyme est déjà utilisé. Veuillez en choisir un autre.");
    } else {
      setPseudoError("");
    }

    setIsCheckingPseudo(false);
  };

  useEffect(() => {
    const allFieldsFilled = Object.values(formData).every(
      (val) => typeof val === "string" && val.trim() !== ""
    );
    const noErrors = !pseudoError;
    setIsFormValid(allFieldsFilled && noErrors);
  }, [formData, pseudoError]);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData((prev) => ({
            ...prev,
            nom: data.nom || "",
            prenoms: data.prenom || "",
            naissance: data.dateNaissance || "",
            pseudo: data.pseudonyme || "",
            telephone: data.phone || "",
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Utilisateur non connecté");

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        nom: formData.nom,
        prenom: formData.prenoms,
        dateNaissance: formData.naissance,
        pseudonyme: formData.pseudo,
        phone: formData.telephone,
        inscription: "2"
      });
      navigate("/intereststep");
    } catch (err) {
      console.error("Erreur de mise à jour :", err);
      alert("Une erreur est survenue");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (name === "pseudo") {
      checkPseudoUnique(value);
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
      <div className=" bg-[#1A2C24] bg-opacity-l70 text-white px-4 py-4 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-sm text-right">1/4</div>

        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-6" />
          <p className="text-sm tracking-widest text-gray-300 mb-6">Inscription</p>
          <h2 className="text-3xl font-bold">Informations</h2>
        </div>

        <form className="flex flex-col gap-8">
          <input value={formData.nom} type="text" name="nom" placeholder="Nom" onChange={handleChange} className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm" />
          <input value={formData.prenoms} type="text" name="prenoms" placeholder="Prénoms" onChange={handleChange} className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm" />
          <input value={formData.pseudo} type="text" name="pseudo" placeholder="Pseudonyme" onChange={handleChange} className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm" />
          <input value={formData.naissance} type="date" name="naissance" placeholder="Date de naissance" onChange={handleChange} className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm text-white" />
          <input value={formData.telephone} type="tel" name="telephone" placeholder="Téléphone" onChange={handleChange} className="bg-transparent border border-white rounded-md px-4 py-2.5 text-sm" />
        </form>

        <div className="flex justify-between mt-6">
          <button className="bg-transparent border border-white text-white px-6 py-2 rounded-lg text-sm"
            onClick={() => navigate("/loginorsignup")}
          >
            RETOUR
          </button>
          <button
            className="bg-[#FF6B2E] text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!isFormValid || isCheckingPseudo}
          >
            SUIVANT
          </button>
        </div>
      </div>
    </div>
  );
}
