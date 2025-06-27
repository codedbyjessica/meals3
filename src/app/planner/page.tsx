"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import MealPlanner from "@/components/MealPlanner";
import Loading from "@/components/Loading";

export default function PlannerPage() {
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
      <MealPlanner />
      <footer className="mt-2 py-8 bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 shadow-lg border-b border-purple-400 backdrop-blur-sm text-center h-[10dvh] text-white">{new Date().getFullYear()}</footer>
    </div>
  );
} 