"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, RotateCw } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Analytics } from "@vercel/analytics/react"

interface ProductImages {
  front: string;
  back: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  images?: ProductImages;
  image?: string;
  hasMultipleViews?: boolean;
  imageScale?: string;
  slug: string;
}

const ProductGallery = () => {
  const [showHoodieBack, setShowHoodieBack] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Set a fixed end date - 14 days from November 7, 2024
      const endDate = new Date('2024-11-21T23:59:59');
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ days, hours, minutes });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const products: Product[] = [
    {
      id: 1,
      name: "DCDC Hoodie",
      price: 36.00,
      images: {
        front: "/images/WhiteSweatshirtFront.png",
        back: "/images/WhiteSweatshirtBack.png"
      },
      hasMultipleViews: true,
      imageScale: "50%",
      slug: "/DCDCHoodiePage"
    },
    {
      id: 4,
      name: "DCDC Customizable Jersey",
      price: 36.00,
      image: "/images/JerseyExample.png",
      imageScale: "80%",
      slug: "/DCDCCustomizableJerseyPage"
    },
    {
      id: 6,
      name: "DCDC White Sweatpants",
      price: 36.00,
      image: "/images/TeamDcDcWhite.png",
      imageScale: "100%",
      slug: "/DCDCWhiteSweatpantsPage"
    }
  ];

  const handleToggleImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setShowHoodieBack(!showHoodieBack);
  };

  const getProductImage = (product: Product): string => {
    if (product.id === 1 && product.images) {
      return showHoodieBack ? product.images.back : product.images.front;
    }
    return product.image || '';
  };

  return (
    <>
      <Analytics />
      <div className="min-h-screen" style={{ backgroundColor: '#DAC2A8' }}>
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-24">
              <div className="w-1/4">
                <Image
                  src="/images/DcDcLogo.png"
                  alt="DCDC Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Link href="/" className="text-2xl font-bold text-black text-center hover:text-gray-700 transition-colors">
                  DCDC Fundraiser Store
                </Link>
              </div>
              
              <div className="w-1/4 flex justify-end items-center">
                <Image
                  src="/images/PILogo.png"
                  alt="PI Logo"
                  width={64}
                  height={64}
                  className="object-contain mr-4"
                />
                <Link href="/cart" className="p-2 rounded-full hover:bg-gray-100">
                  <ShoppingCart className="h-6 w-6 text-black" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link href={product.slug} key={product.id} className="block">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white h-full flex flex-col">
                  <CardContent className="p-4 relative flex-grow flex flex-col items-center">
                    <div className="w-full h-64 relative overflow-hidden flex items-center justify-center">
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        className="object-contain"
                        style={{ 
                          objectFit: 'contain',
                          maxHeight: '100%',
                          width: product.imageScale
                        }}
                      />
                    </div>
                    {product.hasMultipleViews && (
                      <button
                        onClick={handleToggleImage}
                        className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                        title={showHoodieBack ? "Show Front" : "Show Back"}
                      >
                        <RotateCw className="h-5 w-5 text-black" />
                      </button>
                    )}
                    <div className="mt-4 text-center w-full">
                      <h2 className="text-lg font-semibold text-black hover:text-gray-700 transition-colors">{product.name}</h2>
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 py-3 flex justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                    <p className="text-lg font-bold text-black">${product.price.toFixed(2)}</p>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {/* Countdown Timer */}
          <div className="mt-12 mb-8 text-center bg-white/90 rounded-lg p-6 max-w-md mx-auto shadow-lg">
            <h2 className="text-xl font-bold text-black mb-4">Fundraiser Ends In:</h2>
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <span className="text-5xl font-bold text-black">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <p className="text-sm text-black mt-1">Days</p>
              </div>
              <div className="text-center">
                <span className="text-5xl font-bold text-black">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <p className="text-sm text-black mt-1">Hours</p>
              </div>
              <div className="text-center">
                <span className="text-5xl font-bold text-black">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <p className="text-sm text-black mt-1">Minutes</p>
              </div>
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="mt-12 mb-8 rounded-lg p-6 max-w-4xl mx-auto shadow-lg" style={{ backgroundColor: '#992F22' }}>
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Need a Custom Fundraising Store for Your Organization?
            </h2>
            <p className="text-lg text-white text-center mb-6">
              We build free custom online stores for dance teams, sports teams, schools, and organizations!
            </p>
            <div className="text-center space-y-2">
              <p className="text-lg text-white">Contact us to get started:</p>
              <p>
                <a 
                  href="mailto:potomacimprints@gmail.com" 
                  className="text-lg text-blue-200 hover:text-blue-400 font-medium"
                >
                  potomacimprints@gmail.com
                </a>
              </p>
              <p>
                <a 
                  href="tel:3018075747" 
                  className="text-lg text-blue-200 hover:text-blue-400 font-medium"
                >
                  (301) 807-5747
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ProductGallery;