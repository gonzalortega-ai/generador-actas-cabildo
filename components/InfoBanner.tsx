import React, { useState } from 'react';
import { InfoIcon, XIcon } from './Icons';

export const InfoBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mb-6 bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow-sm flex justify-between items-center" role="alert">
            <div className="flex items-center">
                <InfoIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                <div>
                    <p className="font-bold">Información de Uso</p>
                    <p className="text-sm">
                        Esta herramienta utiliza el nivel gratuito de la API de Google Gemini para la generación de contenido.
                        El plan gratuito es muy generoso y te permite generar <strong>cientos de actas con IA cada mes</strong> sin ningún costo.
                        ¡Puedes usar la función de IA con total tranquilidad!
                    </p>
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="ml-4 p-1 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Cerrar"
            >
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    );
};
