import logo from "../../assets/ekanwe-logo.png";
import validatelogo from "../../assets/validatepagelogo.png";
import { useEffect } from "react";
import { auth } from "../../firebase/firebase";


export default function ValidateInscription() {
  useEffect(() => {
    const interval = setInterval(() => {
      auth.currentUser?.reload().then(() => {
        if (auth.currentUser?.emailVerified) {
          window.location.href = "/registrationstepone";
        }
      });
    }, 500);
  
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage:
          "url('https://s3-alpha-sig.figma.com/img/766b/e8b9/25ea265fc6d5c0f04e3e93b27ecd65cb?Expires=1745193600&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=EsyWng5rz5MuEwYQEk01lU7LKsfv2EWoe-0bq8GtYOwvCr3abuoIOUk5UIU3it2DcnrX49Xu~~t-IdgxVen0GevBunbegAqHR-Jki-XrC1EnR84TWM8CrfsNvORud11qi3me9rQJIApdEysnnnPqTq4wtpdrQF9Tho0kRwj7r4IJOftLpWgG4ktpqP2iCobbbxs1KxnwQ7328NMqGPkUlWZ~TPbIg4oFsIzp8xDvk-c3TXJvy8UqR96LNu5zX1BNr~~VsdBcufw5AO8sOty0qgnylO6Lfr0dN-bWqe9zDc~e6PfZRxRupZ-t3vGrHT-KpU3Y0C~pK11-xCM4Tug1rw__')",
      }}
    >
      <div className="bg-[#1A2C24]/90 bg-opacity-70 text-white px-4 py-6 w-11/12 max-w-md rounded-lg shadow-lg">
        <div className="text-center flex flex-col items-center mb-6">
          <img src={logo} alt="Ekanwe logo" className="w-36 mb-10" />
          <h2 className="text-2xl font-bold mb-10">TA DEMANDE DE CANDIDATURE A ÉTÉ ENVOYÉE !</h2>
          <img src={validatelogo} alt="Validation" className="w-32 h-32 mb-10" />
        </div>
        
        <p className="text-2xl uppercase text-center font-bold mb-6">Vérifications</p>
        
        <div className="text-center mb-10">
          <p className="text-sm text-gray-300 mb-2">
            Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour finaliser votre inscription.
          </p>
          <p className="text-sm text-gray-300">
            Si vous ne recevez pas d'email dans les prochaines minutes, vérifiez votre dossier spam.
          </p>
        </div>
        
        <div className="flex justify-between mt-6">
        </div>
      </div>
    </div>
  );
}