  deals.map((deal, index) => (
    <div key={deal.id} className="min-w-[90%] bg-[#1A2C24] rounded-xl overflow-hidden shadow-lg flex flex-col">
      <div className="flex p-5 gap-5">
        <div className="w-1/2">
          <div className="aspect-[4/3] rounded-lg overflow-hidden">
            <img
              src={deal.imageUrl || profile}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="w-1/2 flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="text-xl text-white font-bold mb-2">{deal.title || "Sans titre"}</h3>
            <button 
              onClick={() => toggleSave(index)}
              className="bg-[#1A2C24]/90 p-2 rounded-full hover:bg-[#1A2C24] transition-colors duration-200"
            >
              <img src={savedItems[index] ? fullsave : save} alt="Save" className="w-6 h-6" />
            </button>
          </div>
          <p className="text-sm text-white/90 mb-4 line-clamp-2">
            <span className="font-bold">Description :</span> {deal.description || "-"}
          </p>
          <div className="flex mt-auto">
            {renderStars(deal.rating || 0)}
          </div>
        </div>
      </div>
      <div className="p-5 pt-0 mt-auto">
        <div className="flex justify-between">
          <button
            className="text-white border border-white/50 rounded-lg px-6 py-2.5 text-sm hover:bg-white/10 transition-colors duration-200"
            onClick={() => navigate(`/dealsseemoreinfluenceur/${deal.id}`)}
          >
            Voir plus
          </button>
        </div>
      </div>
    </div>
  )) 