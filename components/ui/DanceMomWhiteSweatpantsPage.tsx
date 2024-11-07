"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface SizeQuantity {
  size: string;
  quantity: number;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  sizes: SizeQuantity[];
  image: string;
}

const DanceMomWhiteSweatpantsPage = () => {
  const [sizeSelections, setSizeSelections] = useState<SizeQuantity[]>([
    { size: "YS", quantity: 0 },
    { size: "YM", quantity: 0 },
    { size: "YL", quantity: 0 },
    { size: "Small", quantity: 0 },
    { size: "Medium", quantity: 0 },
    { size: "Large", quantity: 0 },
    { size: "X-Large", quantity: 0 },
    { size: "XXL", quantity: 0 }
  ]);

  const [addedToCart, setAddedToCart] = useState(false);

  const updateQuantity = (size: string, increment: boolean) => {
    setSizeSelections(prev => prev.map(item => {
      if (item.size === size) {
        return {
          ...item,
          quantity: increment ? item.quantity + 1 : Math.max(0, item.quantity - 1)
        };
      }
      return item;
    }));
    setAddedToCart(false);
  };

  const totalItems = sizeSelections.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = totalItems * 34.99;

  const addToCart = () => {
    const selectedSizes = sizeSelections.filter(size => size.quantity > 0);
    
    if (selectedSizes.length === 0) return;

    const newItem: CartItem = {
      productId: 'dance-mom-white-sweatpants',
      productName: 'Dance Mom White Sweatpants',
      price: 34.99,
      sizes: selectedSizes,
      image: '/images/DanceMomSweats.png'
    };

    try {
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(
        (item: CartItem) => item.productId === newItem.productId
      );

      if (existingItemIndex >= 0) {
        const existingItem = existingCart[existingItemIndex];
        const updatedSizes = [...existingItem.sizes];

        newItem.sizes.forEach(newSize => {
          const existingSizeIndex = updatedSizes.findIndex(size => size.size === newSize.size);
          if (existingSizeIndex >= 0) {
            updatedSizes[existingSizeIndex].quantity += newSize.quantity;
          } else {
            updatedSizes.push(newSize);
          }
        });

        existingCart[existingItemIndex] = {
          ...existingItem,
          sizes: updatedSizes
        };
      } else {
        existingCart.push(newItem);
      }

      localStorage.setItem('cart', JSON.stringify(existingCart));
      setAddedToCart(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
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

      <div className="flex items-start justify-center p-8">
        <Card className="w-full max-w-[1200px] p-6 bg-white">
          <CardContent className="flex gap-8">
            <div className="w-2/3">
              <div className="relative h-[400px] border-2 border-black">
                <Image
                  src="/images/DanceMomSweats.png"
                  alt="Dance Mom White Sweatpants"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="w-1/3">
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-black">Dance Mom White Sweatpants</h1>
                <p className="text-xl text-black">$34.99</p>
                
                <div className="grid grid-cols-2 gap-2">
                  {sizeSelections.map((item) => (
                    <div key={item.size} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-black font-medium w-12">{item.size}</span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateQuantity(item.size, false)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Minus className="h-4 w-4 text-black" />
                        </button>
                        <span className="text-black w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.size, true)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Plus className="h-4 w-4 text-black" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-black font-medium">Total Items:</span>
                    <span className="text-black">{totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black font-medium">Total Price:</span>
                    <span className="text-black">${totalPrice.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={addToCart}
                    className="w-full bg-gray-200 hover:bg-gray-300 p-2 rounded-md text-black disabled:opacity-50"
                    disabled={totalItems === 0}
                  >
                    {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                  </button>
                  {addedToCart && (
                    <div className="text-center space-y-2">
                      <p className="text-green-600 text-sm">Successfully added to cart!</p>
                      <Link href="/cart" className="text-blue-600 hover:text-blue-800 text-sm block">
                        Continue to Cart
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DanceMomWhiteSweatpantsPage;