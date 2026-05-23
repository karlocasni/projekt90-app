import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

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
        automatic_payment_methods: {enabled: true},
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

/**
 * Sends email on new document in 'mail' collection via Zoho SMTP.
 */
export const sendMailFromFirestore = functions.firestore
  .document("mail/{docId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    const to = data.to as string;
    const subject = data.message?.subject as string;
    const html = data.message?.html as string;

    if (!to || !subject || !html) {
      await snap.ref.update({
        delivery: {state: "ERROR", error: "Missing to/subject/html fields"},
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: "kontakt@nemaneide.com",
        pass: "Duvanjskopolje357892!",
      },
    });

    try {
      await transporter.sendMail({
        from: "\"Projekt90\" <kontakt@nemaneide.com>",
        to,
        subject,
        html,
      });

      await snap.ref.update({
        delivery: {
          state: "SUCCESS",
          endTime: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
      console.log(`Email uspješno poslan na: ${to}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "SMTP error";
      console.error("Email greška:", message);
      await snap.ref.update({
        delivery: {state: "ERROR", error: message},
      });
    }
  });

/**
 * Daily scheduled job: auto-expire subscriptions.
 * Runs every day at 02:00 UTC.
 * Sets status:'inactive' for profiles where
 * today >= createdAt + 90 + offsetDays.
 */
export const checkSubscriptionExpiry = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    const db = admin.firestore();
    const now = Date.now();

    const snapshot = await db
      .collection("profiles")
      .where("status", "==", "active")
      .get();

    const batch = db.batch();
    let expiredCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Parse createdAt — Firestore Timestamp or ISO string
      let createdMs: number | null = null;
      if (data.createdAt && typeof data.createdAt.toMillis === "function") {
        createdMs = data.createdAt.toMillis();
      } else if (typeof data.createdAt === "string") {
        const d = new Date(data.createdAt);
        if (!isNaN(d.getTime())) createdMs = d.getTime();
      }

      if (!createdMs) return;

      const offsetDays: number = data.offsetDays || 0;
      const expiryMs = createdMs + (90 + offsetDays) * 24 * 60 * 60 * 1000;

      if (now >= expiryMs) {
        batch.update(docSnap.ref, {status: "inactive"});
        expiredCount++;
        console.log(
          `Expired: ${docSnap.id} (offset: ${offsetDays})`
        );
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
    }

    console.log(`Subscription check done. Expired: ${expiredCount}`);
    return null;
  });

/**
 * Sends a custom email verification link using
 * the existing mail collection logic.
 */
export const sendCustomVerificationEmail = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in to request verification."
      );
    }
    const email = context.auth.token.email;
    if (!email) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "User has no email."
      );
    }

    try {
      const link = await admin.auth().generateEmailVerificationLink(email);

      await admin.firestore().collection("mail").add({
        to: email,
        message: {
          subject: "Potvrdi svoju email adresu - Projekt90",
          /* eslint-disable max-len */
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #161616; color: #ffffff; padding: 40px; border-radius: 20px;">
              <h1 style="color: #D4FF00; font-size: 24px; margin-bottom: 20px;">Dobrodošao u Projekt90 pleme!</h1>
              <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Da bismo bili sigurni da si to stvarno ti i kako bismo izbjegli lažne prijave, molimo te da potvrdiš svoju email adresu klikom na gumb ispod.
              </p>
              <a href="${link}" style="display: inline-block; background: #D4FF00; color: #000000; font-weight: bold; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-size: 16px;">
                POTVRDI EMAIL
              </a>
              <p style="font-size: 14px; color: #888888; margin-top: 40px;">
                Ako nisi zatražio ovaj email, možeš ga slobodno ignorirati.
              </p>
            </div>
          `,
          /* eslint-enable max-len */
        },
      });
      return {success: true};
    } catch (error) {
      console.error("Error sending custom verification email:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Could not send verification email."
      );
    }
  }
);
