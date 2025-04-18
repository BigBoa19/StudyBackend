import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {groupDetails, userDetails} from "../types";
import {Firestore} from "firebase-admin/firestore";
import {logJoinEvent} from "../bq/bqService";
import {
  fetchGroup,
  isUserOwnerOfGroup,
  updateGroupFields,
} from "../helpers";

export const updateGroup = async (
  db: Firestore,
  req: Request,
  res: Response,
) => {
  logger.info("Received updateGroup request", {structuredData: true});
  if (req.method !== "POST") {
    res.status(405).send({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
    return;
  }
  const {id, email, location, details} = req.body;
  if (!(id && email)) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. Both 'id' and 'email' are required.",
    });
    return;
  }
  if (!(location || details)) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. Either 'location' or 'details' is required.",
    });
    return;
  }

  try {
    const groupDocSnapshot = await fetchGroup(db, id);

    if (!groupDocSnapshot.exists) {
      res.status(400).send({success: false, message: "Group not found."});
      return;
    }

    const group = groupDocSnapshot.data() as groupDetails;

    if (!(group.participantDetails && group.participantDetails.length == 0)) {
      res.status(400).send(
        {success: false, message: "Nonexistent or Empty Participant Details."}
      );
      return;
    }

    if (!isUserOwnerOfGroup(email, group)) {
      res.status(400).send(
        {success: false, message: "User not owner of group."}
      );
      return;
    }
    await updateGroupFields(groupDocSnapshot.ref, location, details);
    res.status(200).send({success: true, message: "Updated Group."});
    // try {
    //   await logJoinEvent(isJoinEvent, email, group.id);
    // } catch (error) {
    //   logger.error("Bigquery Error: ", {structuredData: true, error});
    // }
  } catch (error) {
    logger.error("Error Updating Group:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
