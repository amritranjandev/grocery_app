import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";

// place order cod: /api/order/cod

export const placeOrderCOD = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        if (!userId || !items || !address) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // calculate total price
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error("Product not found");
            }
            return acc + product.offerPrice * item.quantity;
        }, 0);

        // Add tax 2%
        amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        });
        return res.status(201).json({ success: true, message: "Order placed successfully" });
    }
    catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ success: false, message: "Failed to place order" });
    }
}

// place order stripe: /api/order/stripe
export const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address } = req.body;
        const {origin} = req.headers;
        if (!userId || !items || !address) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let productData  = [];

        // calculate total price
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error("Product not found");
            }
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            });
            return acc + product.offerPrice * item.quantity;
        }, 0);

        // Add tax 2%
        amount += Math.floor(amount * 0.02);

        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        });

        // stripe gateway initilization
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // craete lineItems for stripe
        const line_items = productData.map((item)=>{
            return {
                price_data: {
                    currency: "usd",
                    product_data:{
                        name: item.name,
                    },
                    unit_amount: Math.floor(item.price + item.price*0.02 )*100
                },
                quantity: item.quantity
            }
        })

        // create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata:{
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.status(201).json({ success: true, url: session.url, message: "Order placed successfully" });
    }
    catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ success: false, message: "Failed to place order" });
    }
}

// STRIPE WEBHOOKS to verify payments action: /stripe
export const stripeWebhooks = async (request, response) =>{

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = request.headers["stripe-signature"]
    let event;

    try{
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)

    }catch(error){
        response.status(400).send(`webhook error: ${error.message}`)
    }

    // handle event
    switch (event.type) {
        case "payment_intent.succeeded":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // get session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const {orderId, userId} = session.data[0].metadata;

            // mark payment as paid
            await Order.findByIdAndUpdate(orderId, {isPaid: true})

            // clear user cart
            await User.findByIdAndUpdate(userId, {cartItems: {}});
            break;
        }
        case "payment_intent.payment_failed":{
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            // get session metadata
            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId,
            });

            const {orderId} = session.data[0].metadata;
            await Order.findByIdAndDelete(orderId);
            break
        }
            
        default:
            console.error(`Unhandled event type ${event.type}`)
            break;
    }
    response.json({received: true})

}

// get orders by userId: /api/order/user
export const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: "Missing userId" });
        }
        const orders = await Order.find({ userId, $or: [{ paymentType: "COD" }, { isPaid: true }] }).populate("items.product address").sort({ createdAt: -1 });
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
}

// get all orders (for seller/admin): /api/order/seller
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({ $or: [{ paymentType: "COD" }, { isPaid: true }] }).populate("items.product address").sort({ createdAt: -1 });
        if (!orders) {
            return res.status(404).json({ success: false, message: "No orders found" });
        }
        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
}