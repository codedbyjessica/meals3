"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import RecipeManager from "@/components/RecipeManager";
import Loading from "@/components/Loading";
import Footer from "@/components/Footer";

export default function RecipesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Collection</h1>
          <p className="text-gray-600">
            Save and organize the recipes you actually love. Add new recipes, edit existing ones, and organize them with tags.
          </p>
        </div>
        <RecipeManager />
      </div>
      <Footer />
    </div>
  );
} 