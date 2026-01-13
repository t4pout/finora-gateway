'use client';

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export default function CloudinaryUpload({ onUpload, currentImage }: CloudinaryUploadProps) {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    if (url) {
      onUpload(url);
    }
  };

  return (
    <div>
      {currentImage && (
        <div className="mb-4">
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Imagem+Indisponível';
            }}
          />
        </div>
      )}
      
      <input
        type="url"
        placeholder="Cole a URL da imagem (ex: https://imgur.com/...)"
        onChange={handleUrlChange}
        defaultValue={currentImage}
        className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none text-gray-900"
      />
      
      <p className="text-sm text-gray-500 mt-2">
        💡 Dica: Faça upload em <a href="https://imgur.com" target="_blank" className="text-purple-600 underline">Imgur</a> ou <a href="https://imgbb.com" target="_blank" className="text-purple-600 underline">ImgBB</a> e cole o link aqui
      </p>
    </div>
  );
}
