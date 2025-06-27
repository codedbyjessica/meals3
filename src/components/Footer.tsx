"use client";

export default function Footer() {

  return (

      <footer className="mt-2 py-8 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 shadow-lg border-b border-purple-400 backdrop-blur-sm text-center h-[10dvh] text-white">
        <p>&copy; {new Date().getFullYear()} <a href="https://codedbyjessica.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/90">www.codedbyjessica.com</a></p>
      </footer>
  );
} 