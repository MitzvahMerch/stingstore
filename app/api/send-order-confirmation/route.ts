import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Define detailed types for the order details
interface Size {
  size: string;
  quantity: number;
}

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  sizes: Size[];
  totalQuantity: number;
  itemTotal: number;
}

interface OrderSummary {
  totalAmount: number;
  totalItems: number;
  currency: string;
}

interface PaymentDetails {
  paypalOrderId: string;
  paymentStatus: string;
  payerEmail: string;
  payerName: string;
  transactionDate: string;
}

interface OrderDetails {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dancerName: string;
  };
  items: CartItem[];
  orderSummary: OrderSummary;
  paymentDetails: PaymentDetails;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderRequestBody {
  orderDetails: OrderDetails;
  customerInfo: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    dancerName: string;
  };
  cartItems: Array<{
    productName: string;
    price: number;
    sizes: Array<{
      size: string;
      quantity: number;
    }>;
  }>;
  orderId: string;
  totalPrice: number;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body: OrderRequestBody = await request.json();
    const { customerInfo, cartItems, orderId, totalPrice } = body;

    const emailResult = await resend.emails.send({
      from: 'DCDC Fundraiser Store <orders@potomacimprints.com>',
      to: customerInfo.email,
      subject: `DCDC Fundraiser Order Confirmation - ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Thanks for your DCDC Fundraiser order!</h1>
          
          <div style="background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Dancer's Name:</strong> ${customerInfo.dancerName}</p>
          </div>

          <h2 style="color: #444;">Order Summary:</h2>
          ${cartItems.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <h3 style="margin: 0; color: #333;">${item.productName}</h3>
              <div style="color: #666; margin: 5px 0;">
                ${item.sizes.map(size => 
                  `<div>${size.size}: ${size.quantity}</div>`
                ).join('')}
              </div>
              <p style="margin: 5px 0; font-weight: bold; color: #333;">
                $${(item.price * item.sizes.reduce((sum, size) => sum + size.quantity, 0)).toFixed(2)}
              </p>
            </div>
          `).join('')}

          <div style="background-color: #f7f7f7; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <h3 style="margin: 0; color: #333;">Total: $${totalPrice.toFixed(2)}</h3>
          </div>

          <div style="margin-top: 30px; color: #666;">
            <h3 style="color: #333;">Customer Information</h3>
            <p><strong>Name:</strong> ${customerInfo.firstName} ${customerInfo.lastName}</p>
            <p><strong>Email:</strong> ${customerInfo.email}</p>
            <p><strong>Phone:</strong> ${customerInfo.phone}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>Thank you for supporting DCDC!</p>
            <p>If you have any questions about your order, please contact us.</p>
          </div>
        </div>
      `
    });

    if ('error' in emailResult && emailResult.error) {
      return NextResponse.json({ error: emailResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: emailResult });
  } catch (error) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}  