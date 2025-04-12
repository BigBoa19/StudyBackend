import dotenv from "dotenv";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import { groupDetails } from "../types";

dotenv.config();

async function sendSimpleMessageTemplate(group: groupDetails) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_KEY || ""});

    try {
      const data = await mg.messages.create("scottylabs.org", {
        from: "Mailgun Sandbox <postmaster@scottylabsm.org>",
        to: group.participantDetails.map(participant => `${participant.name} <${participant.email}>`),
        subject: `Study Group Reminder: ${group.title}`,
        template: "scottyfinder reminder",
        "h:X-Mailgun-Variables": JSON.stringify({ 
          groupTitle: group.title,
          groupLocation: group.location,
          groupPurpose: group.purpose,
          groupCourse: group.course,
          startTime: group.startTime.toDate().toLocaleString(),
          participants: group.participantDetails.map(p => ({
            name: p.name,
            email: p.email,
            imageUrl: p.url
          }))
        }),
      });
      console.log(data);
    } catch (error) {
      console.log(error);
    }
  }
//   sendSimpleMessageTemplate();