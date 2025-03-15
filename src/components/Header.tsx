import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold">
          Real time Translator
        </h1>
      </div>
    </header>
  );
};

export default Header; 