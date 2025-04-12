import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {groupDetails} from "../types";
import {Firestore} from "firebase-admin/firestore";
import {
  fetchGroup,
  sendSimpleMessageTemplate,
} from "../helpers";

export const sendEmail = async (
  db: Firestore,
  req: Request,
  res: Response,
) => {
  logger.info("Received sendEmail request", {structuredData: true});
  if (req.method !== "POST") {
    res.status(405).send({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
    return;
  }
  const {groupID} = req.body;
  if (!groupID) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. 'groupID' is required.",
    });
    return;
  }

  try {
    const groupDocSnapshot = await fetchGroup(db, groupID);

    if (!groupDocSnapshot.exists) {
      res.status(400).send({success: false, message: "Group not found."});
      return;
    }

    const group = groupDocSnapshot.data() as groupDetails;

    if (!(group && group.participantDetails)) {
      res.status(400).send({
        success: false,
        message: "Group missing required field: participantDetails.",
      });
      return;
    }

    if (group.participantDetails.length === 0) {
      res.status(400).send({
        success: false,
        message: "Group has no participants to send email to.",
      });
      return;
    }

    await sendSimpleMessageTemplate(group);
    res.status(200).send({success: true, message: "Email sent to group members."});
  } catch (error) {
    logger.error("Error sending email:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
