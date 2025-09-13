import { useState, useEffect } from 'react';
import { Subcategory } from '@/types';
import api from '@/lib/api';

export const useSubcategories = (categoryId?: string | number) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
  }, [categoryId]);

  const loadSubcategories = async (catId: string | number) => {
    setLoading(true);
    try {
      const response = await api.get(`/subcategories/?category=${catId}`);
      setSubcategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  };

  return { subcategories, loading };
};