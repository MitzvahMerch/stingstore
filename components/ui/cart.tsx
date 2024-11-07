"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';



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
  jerseyName?: string;  // Add this line
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dancerName: string;
}

interface PayPalOrderData {
  orderID: string;
}

interface PayPalActions {
  order: {
    create: (data: {
      purchase_units: Array<{
        amount: {
          value: string;
          currency_code: string;
        };
        description: string;
      }>;
    }) => Promise<string>;
    capture: () => Promise<PayPalOrderDetails>;
  };
}

interface PayPalOrderDetails {
  id: string;
  status: string;
  payer: {
    email_address: string;
    name: {
      given_name: string;
      surname: string;
    };
  };
  purchase_units: Array<{
    shipping: {
      name: {
        full_name: string;
      };
      address: {
        address_line_1: string;
        admin_area_2: string;
        admin_area_1: string;
        postal_code: string;
        country_code: string;
      };
    };
  }>;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: (data: PayPalOrderData, actions: PayPalActions) => Promise<string>;
        onApprove: (data: PayPalOrderData, actions: PayPalActions) => Promise<void>;
      }) => {
        render: (element: HTMLElement) => void;
      };
    };
  }
}


const CartPage = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dancerName: ''
  });

  const totalPrice = cartItems.reduce((total, item) => {
    const itemTotal = item.sizes.reduce((sum, size) => sum + (size.quantity * item.price), 0);
    return total + itemTotal;
  }, 0);

  const totalItems = cartItems.reduce((total, item) => {
    return total + item.sizes.reduce((sum, size) => sum + size.quantity, 0);
  }, 0);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

// Validate form fields
const validateForm = () => {
  const { firstName, lastName, email, phone, dancerName } = customerInfo;
  
  return (
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    dancerName.trim() !== ''
  );
};

// Handle form input changes
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setCustomerInfo(prev => ({
    ...prev,
    [name]: value
  }));
  
  setFormComplete(validateForm());
};
useEffect(() => {
  if (!paypalButtonRef.current || !cartItems.length || !window.paypal || !formComplete) return;

  // Store the current container reference
  const container = paypalButtonRef.current;
  
  const buttons = window.paypal.Buttons({
    createOrder: (data: PayPalOrderData, actions: PayPalActions) => {
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: totalPrice.toFixed(2),
            currency_code: "USD"
          },
          description: `DCDC Fundraiser Store Order - ${totalItems} items`
        }]
      });
    },
    onApprove: async (data: PayPalOrderData, actions: PayPalActions) => {
      try {
        setIsProcessing(true);
        console.log('1. Starting PayPal approval process');
    
        const details = await actions.order.capture();
        console.log('2. PayPal capture successful:', details);
    
        const orderData = {
          customerInfo: {
            ...customerInfo,  // This includes the dancerName from the form
          },
          items: cartItems.map(item => ({
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            sizes: item.sizes,
            jerseyName: item.jerseyName || null,  // Make explicit that non-jersey items don't have this
            totalQuantity: item.sizes.reduce((sum, size) => sum + size.quantity, 0),
            itemTotal: item.price * item.sizes.reduce((sum, size) => sum + size.quantity, 0)
          })),
          orderSummary: {
            totalAmount: Number(totalPrice.toFixed(2)),
            totalItems,
            currency: 'USD',
            dancerName: customerInfo.dancerName  // Add dancer's name at the order level
          },
          paymentDetails: {
            paypalOrderId: details.id,
            paymentStatus: details.status,
            payerEmail: details.payer.email_address,
            payerName: `${details.payer.name.given_name} ${details.payer.name.surname}`,
            transactionDate: new Date().toISOString()
          },
          orderStatus: 'pending',
          dancerName: customerInfo.dancerName,  // Add it here too for top-level access
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Direct write to dcdc-orders
        const ordersRef = collection(db, 'dcdc-orders');
        const docRef = await addDoc(ordersRef, orderData);
        console.log('Order saved with ID:', docRef.id);
    
        // Send confirmation email
        try {
          await fetch('/api/send-order-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderDetails: orderData,
              customerInfo,
              cartItems,
              orderId: docRef.id,
              totalPrice
            }),
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
    
        // Clear cart and show success
        localStorage.removeItem('cart');
        setCartItems([]);
        alert(`Thank you for your order! Your order ID is: ${docRef.id}`);
    
      } catch (error) {
        console.error('Error Details:', {
          name: error instanceof FirebaseError ? error.name : 'Unknown',
          code: error instanceof FirebaseError ? error.code : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          raw: error
        });
        
        alert('There was an error processing your order. Please save this PayPal Transaction ID: ' + data.orderID + ' and contact support. Your payment was successful but there was an error saving the order details.');
      } finally {
        setIsProcessing(false);
      }
    }
  });

  buttons.render(container);

  return () => {
    if (container) {
      container.innerHTML = '';
    }
  };
}, [cartItems, totalItems, totalPrice, formComplete, customerInfo]);

const removeItem = (productId: string, jerseyName?: string) => {
  const newCart = cartItems.filter(item => 
    !(item.productId === productId && item.jerseyName === jerseyName)
  );
  setCartItems(newCart);
  localStorage.setItem('cart', JSON.stringify(newCart));
};

  const renderCustomerForm = () => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-black">Customer Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            value={customerInfo.firstName}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-black"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={customerInfo.lastName}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-black"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={customerInfo.email}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-black"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={customerInfo.phone}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-black"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dancer&apos;s Name
          </label>
          <input
            type="text"
            name="dancerName"
            value={customerInfo.dancerName}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-2 text-black"
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DAC2A8' }}>
      {/* Navigation Header */}
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
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Content */}
      <div className="max-w-4xl mx-auto p-8">
        <Card className="bg-white">
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-black mb-6">Shopping Cart ({totalItems} items)</h1>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty</p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.jerseyName || ''}`} className="flex gap-4 p-4 border rounded-lg">
                      {/* Product Image */}
                      <div className="relative w-24 h-24">
                        <Image
                          src={item.image}
                          alt={item.productName}
                          fill
                          className="object-contain"
                        />
                      </div>

    {/* Product Details */}
    <div className="flex-1">
      <div className="flex justify-between">
        <div>
          <h2 className="font-semibold text-black">{item.productName}</h2>
          {item.jerseyName && (
            <p className="text-sm text-gray-600 mt-1">
              Jersey Name: {item.jerseyName}
            </p>
          )}
        </div>
        <button 
          onClick={() => removeItem(item.productId, item.jerseyName)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
                        
                        {/* Size Quantities */}
                        <div className="mt-2 space-y-1">
                          {item.sizes.map((size) => (
                            <div key={size.size} className="flex items-center text-sm text-gray-600">
                              <span className="w-12">{size.size}:</span>
                              <span className="ml-2">Qty: {size.quantity}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Item Total */}
                        <div className="mt-2 text-right">
                          <p className="text-black font-medium">
                            ${(item.price * item.sizes.reduce((sum, size) => sum + size.quantity, 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Form and Cart Summary */}
                <div className="mt-8 border-t pt-6">
                  {renderCustomerForm()}
                  <div className="flex justify-between text-xl font-bold text-black mb-6">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  {formComplete ? (
                    <div 
                      ref={paypalButtonRef}
                      className={`${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                    />
                  ) : (
                    <div className="text-center text-gray-600 my-4">
                      Please complete all required fields to proceed with payment
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center mt-4 text-gray-600">
                      Processing your order...
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartPage; 