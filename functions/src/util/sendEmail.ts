import dotenv from "dotenv";
import Mailgun from "mailgun.js";
import FormData from "form-data";

dotenv.config();

async function sendSimpleMessageTemplate() {

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_KEY || ""});

    try {
      const data = await mg.messages.create("scottylabs.org", {
        from: "Mailgun Sandbox <postmaster@scottylabsm.org>",
        to: ["ScottyLabs Operations <shyamaks@andrew.cmu.edu>"],
        subject: "Hello ScottyLabs Operations",
        template: "scottyfinder reminder",
        "h:X-Mailgun-Variables": JSON.stringify({ test: "test", img1: "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18ybWlVdWlNNVdzTXZCMXdUdGR2cTVRNWlCZnAifQ" }),
      });
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }
//   sendSimpleMessageTemplate();