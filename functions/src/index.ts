import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require("stripe");
const StripeConstructor = Stripe.default || Stripe;

admin.initializeApp();

const stripe = new StripeConstructor(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-04-10",
});

/**
 * Creates a PaymentIntent and returns the clientSecret. (v1)
 */
export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Please sign in to continue."
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 4900,
        currency: "eur",
        metadata: {
          userId: context.auth.uid,
          email: context.auth.token.email || "",
        },
        payment_method_types: ["card"],
      });

      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Stripe error";
      console.error("Stripe Error:", message);
      throw new functions.https.HttpsError("internal", message);
    }
  });

/**
 * Stripe Webhook handler. (v1)
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook error";
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentIntent = event.data.object as any;
    const userId = paymentIntent.metadata.userId;

    if (userId) {
      await admin.firestore().collection("profiles").doc(userId).set({
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
    }
  }

  res.json({received: true});
});
