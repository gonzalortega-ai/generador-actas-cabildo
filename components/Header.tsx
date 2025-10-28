
import React from 'react';
import { FileTextIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 flex items-center">
        <FileTextIcon className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 ml-3">
          Generador de Actas de Cabildo
        </h1>
      </div>
    </header>
  );
};
