import { useRef, useState } from "react";
import cloche from "../../assets/clochenotification.png";
import sign from "../../assets/ekanwesign.png";
import loupe from "../../assets/loupe.png";
import menu from "../../assets/menu.png";
import { useNavigate } from "react-router-dom";
import BottomNavbar from "./BottomNavbar";
import save from "../../assets/save.png";
import fullsave from "../../assets/fullsave.png";

export default function SaveDealsPage() {
  const navigate = useNavigate();
  const popularRef = useRef(null);
  
  const [savedStates, setSavedStates] = useState([true, true, true]);
  
  const SaveDeals = [
    {
      title: "Commerçant",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse...",
    },
    {
      title: "Restaurant",
      image: "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
      description: "Excepteur sint occaecat cupidatat non proident, sunt in culpa...",
    },
    {
      title: "Boutique Sport",
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c",
      description: "Matériel haut de gamme pour tous les passionnés de sport...",
    },
  ];

  const toggleSaveState = (index:number) => {
    setSavedStates(prevStates => {
      const newStates = [...prevStates];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5E7] text-[#14210F] pb-32 pt-5">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-3xl font-bold">Enrégistrés</h1>
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/notification")}>
            <img src={cloche} alt="Notification" className="w-6 h-6" />
          </button>
          <img src={sign} alt="Ekanwe Sign" className="w-6 h-6" />
        </div>
      </div>
      
      <div className="px-4 mb-4">
        <div className="flex items-center bg-white/10 border border-black rounded-lg px-3 py-2">
          <div className="text-xl mr-3">
            <img src={loupe} alt="loupe" className="w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Recherche"
            className="flex-grow outline-none bg-transparent text-2xs"
          />
          <div className="text-gray-400 text-lg ml-2">
            <img src={menu} alt="Menu" className="w-6 h-6" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center px-4 justify-between mb-2">
        <div className="flex space-x-4 text-2xl"></div>
      </div>
      
      <div ref={popularRef} className="px-4 mb-6">
        {SaveDeals.map((deal, index) => (
          <div
            key={index}
            className="min-w-full mb-5 bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg"
          >
            <div className="relative">
              <img
                src={deal.image}
                alt={deal.title}
                className="w-full p-4 rounded-lg h-40 object-cover"
              />
              <button 
                className="absolute bottom-4 right-4 p-2 rounded-full"
                onClick={() => toggleSaveState(index)}
              >
                <img 
                  src={savedStates[index] ? fullsave : save} 
                  alt="save" 
                  className="w-5 h-5" 
                />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-lg text-white font-bold mb-1">{deal.title}</h3>
              <p className="text-sm text-white mb-3">{deal.description}</p>
              <div className="flex justify-between mt-8">
                <button 
                  className="text-white border border-white rounded-lg px-4 py-2 text-sm"
                  onClick={() => navigate("/dealSeeMore")}
                >
                  Voir plus
                </button>
                <button className="bg-[#FF6B2E] border border-white text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Dealer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div>
        <BottomNavbar />
      </div>
    </div>
  );
}