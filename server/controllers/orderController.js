import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";
import Stripe from "stripe";

import User from "../models/User.js";

//  Place Order COD  : /api/order/cod

export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;
    // const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      return res.json({success: false, message: "Invalid data" });
    }
    //Calculate Amount Using Items
    let amount = await items.reduce(async(acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    //Add Tax Charge (2%)
    amount += Math.floor(amount * 0.02);

    // await Order.create({

    const newOrder = await Order.create({
      userId,
      items,
       amount,
      address,
      paymentType: 'COD'
      // isPaid: false,
    });
    // console.log("✅ Order created:", newOrder);
    return res.json({ success: true, message: "Order Placed Successfully",order: newOrder });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
}

//  Place Order COD  : /api/order/stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, address } = req.body;
    const {origin} = req.headers;
    // const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      // console.log("error")
      return res.json({success: false, message: "Invalid data" });
    }

    let productData = [];


    //Calculate Amount Using Items
    let amount = await items.reduce(async(acc, item) => {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,


      });


      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    //Add Tax Charge (2%)
    amount += Math.floor(amount * 0.02);

    // await Order.create({

    const order = await Order.create({
      userId,
      items,
       amount,
      address,
      paymentType: 'Online',
      // isPaid: false,
    });

    //Stripe Gateway Initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)

    //create line items for stripe

    const line_items = productData.map((item)=>{
      return {
        price_data: {
          currency: 'usd',
          product_data:{
            name: item.name,
          },
          unit_amount: Math.floor(item.price + item.price * 0.02) * 100
        },
        quantity: item.quantity,
      }
    })


    //create session 
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      }
    })




    // console.log("✅ Order created:", newOrder);
    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
}

// Stripe Webhooks to Verify Payments Action : /stripe

export const stripeWebhooks = async (request, response)=>{

  // Stripe Gateway Initialize
   const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

   const sig = request.headers['stripe-signature'];
   let event;

   try{
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
   } catch(error){
    response.status(400).send(`Webhook Error: ${error.message}`)

   }

   // Handle the event

   switch (event.type) {
    case 'payment_intent.succeeded':{
      const paymentIntent = event.data.object;
      const paymentIntendId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntendId,
      });
      const { orderId, userId } = session.data[0].metadata;
      // Mark Payment as Paid
      await Order.findByIdAndUpdate(orderId, {isPaid: true})
      // Clear user cart
      await User.findByIdAndUpdate(userId, {cartItems:{}});
      break;
    }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
      const paymentIntendId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntendId,
      });
      const { orderId } = session.data[0].metadata;  
      await Order.findByIdAndDelete(orderId);
      break;

      }
       default:
        console.error(`Unhandled event type: ${event.type}`);
        break;
   }
   response.json({received: true})


}









// Get Order By User ID : /api/order/user

export const getUserOrders = async (req, res) => {
  try {
    // const { userId } = req.body;
    const userId = req.user.id;
// console.log("Fetching orders for:", userId);
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }]
    })
      // .populate("items.product address")
      .populate("items.product")
.populate("address")
     
      .sort({ createdAt: -1 });


      // console.log("Orders found:", orders.length);
      // console.log("📦 Orders found for user:", JSON.stringify(orders, null, 2)); 



    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}


// GetAll Orders ( for seller / admin ) : /api/order/seller

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }]

    })
     .populate("items.product")
        .populate("address")
    
    // .populate("items.product address")
    .sort({createdAt: -1});
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
