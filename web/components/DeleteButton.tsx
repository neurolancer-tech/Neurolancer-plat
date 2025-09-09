"use client";

import { useState } from "react";
import api from "@/lib/api";

interface DeleteButtonProps {
  label?: string;
  confirmMessage?: string;
  request: { url: string; method?: "delete" | "post" | "put"; body?: any };
  onSuccess?: () => void;
  className?: string;
}

export default function DeleteButton({
  label = "Delete",
  confirmMessage = "Are you sure you want to delete this item?",
  request,
  onSuccess,
  className,
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;
    const ok = window.confirm(confirmMessage);
    if (!ok) return;

    setLoading(true);
    try {
      const method = request.method || "delete";
      if (method === "delete") {
        await api.delete(request.url);
      } else if (method === "post") {
        await api.post(request.url, request.body ?? {});
      } else if (method === "put") {
        await api.put(request.url, request.body ?? {});
      }
      onSuccess?.();
    } catch (err: any) {
      console.error("Delete action failed:", err);
      alert(err?.response?.data?.error || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className={
        className ||
        "px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium disabled:opacity-50"
      }
      aria-busy={loading}
    >
      {loading ? "Deleting..." : label}
    </button>
  );
}

