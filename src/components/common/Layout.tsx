import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {children}
    </main>
  );
};