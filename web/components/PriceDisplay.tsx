'use client';

import { useState, useEffect } from 'react';
import { convertUSDToKES, formatKES } from '@/lib/currency';

interface PriceDisplayProps {
  usdPrice: number;
  className?: string;
}

export default function PriceDisplay({ usdPrice, className = '' }: PriceDisplayProps) {
  const [kesPrice, setKesPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const convertPrice = async () => {
      try {
        const converted = await convertUSDToKES(usdPrice);
        setKesPrice(converted);
      } catch (error) {
        console.error('Price conversion error:', error);
        setKesPrice(usdPrice * 130); // Fallback
      } finally {
        setLoading(false);
      }
    };

    convertPrice();
  }, [usdPrice]);

  if (loading) {
    return <span className={className}>Loading...</span>;
  }

  return (
    <span className={className}>
      {kesPrice ? formatKES(kesPrice) : `$${usdPrice}`}
    </span>
  );
}