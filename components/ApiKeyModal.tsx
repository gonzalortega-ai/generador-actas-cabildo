
import React, { useState } from 'react';
import { Button } from './Button';
import { InputField } from './InputField';
import { XIcon } from './Icons';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [localApiKey, setLocalApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(localApiKey);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 m-4 max-w-lg w-full relative transform transition-all animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          aria-label="Cerrar modal"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Se necesita tu Clave de API</h2>
        <p className="text-slate-600 mb-6">
          Para utilizar la función de generación con IA, por favor, introduce tu clave de API de Google Gemini.
          Esta clave se usará solo en tu navegador y no se guardará permanentemente.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Clave de API de Google Gemini"
            name="apiKey"
            type="text"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="Pega tu clave aquí..."
          />
          <div className="text-sm text-slate-500">
            Puedes obtener tu clave de forma gratuita en{' '}
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline font-medium"
            >
              Google AI Studio
            </a>.
          </div>
          <div className="pt-4 flex justify-end">
            {/* FIX: Removed invalid `onClick` and added support for `type` in Button component. */}
            <Button type="submit">
              Guardar y Continuar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
