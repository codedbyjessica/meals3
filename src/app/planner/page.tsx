"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import MealPlanner from "@/components/MealPlanner";
import Loading from "@/components/Loading";
import Footer from "@/components/Footer";

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
      <Footer />
    </div>
  );
} 