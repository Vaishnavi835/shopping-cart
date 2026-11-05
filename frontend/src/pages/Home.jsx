import React from 'react';
import Hero from '../components/Hero';
import CategoryStrip from '../components/CategoryStrip';
import { AuthProvider } from '../context/AuthContext';

export default function Home() {
  return (
    <AuthProvider>
      <main className="shop-home-page">
        <Hero />
        <CategoryStrip />
      </main>
    </AuthProvider>
  );
}

