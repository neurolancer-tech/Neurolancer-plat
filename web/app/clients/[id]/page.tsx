"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Avatar from "@/components/Avatar";
import api from "@/lib/api";
import { useParams } from "next/navigation";

interface ClientProfile {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
}

interface ClientStats {
  user: ClientProfile;
  user_type: string;
  total_orders?: number;
  active_orders?: number;
  pending_orders?: number;
  completed_orders?: number;
  total_spent?: number;
}

export default function ClientDetailsPage() {
  const params = useParams();
  const userId = Number(params.id);
  const [data, setData] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        // Reuse backend endpoint that returns either freelancer or client stats
        const res = await api.get(`/freelancers/${userId}/`);
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.error || "Failed to load client details");
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(userId)) load();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : data ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <Avatar size="lg" alt={data.user.first_name || data.user.username} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.user.first_name} {data.user.last_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">@{data.user.username} • Client</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Orders</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{data.total_orders ?? 0}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Active</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{data.active_orders ?? 0}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Completed</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{data.completed_orders ?? 0}</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Spent</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">${(data.total_spent ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

