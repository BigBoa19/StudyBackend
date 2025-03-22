import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {groupDetails, userDetails} from "../types";
import {Firestore} from "firebase-admin/firestore";
import {logJoinEvent} from "../bq/bqService";
import {
  fetchGroup,
  fetchUser,
  isUserInGroup,
  updateGroupMembership,
} from "../helpers";

export const leaveGroup = async (
  db: Firestore,
  req: Request,
  res: Response,
) => {
  logger.info("Received leaveGroup request", {structuredData: true});
  if (req.method !== "POST") {
    res.status(405).send({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
    return;
  }
  const {id, email} = req.body;
  if (!(id && email)) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. Both 'id' and 'email' are required.",
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

    if (!(group && group.participantDetails)) {
      res.status(400).send({
        success: false,
        message: "Group missing required field: participantDetails.",
      });
      return;
    }

    const userDocSnapshot = await fetchUser(db, email);

    if (!userDocSnapshot.exists) {
      res.status(400).send({success: false, message: "User not found."});
      return;
    }

    const user = userDocSnapshot.data() as Partial<userDetails>;

    if (!(user && Array.isArray(user.joinedGroups))) {
      res.status(400).send({
        success: false,
        message: "User missing required field: joinedGroups.",
      });
      return;
    }
    if (!isUserInGroup(user, group)) {
      res
        .status(400)
        .send({success: false, message: "User not in group."});
      return;
    }
    const isJoinEvent = false;
    await updateGroupMembership(db, isJoinEvent, email, user, group.id);
    res.status(200).send({success: true, message: "Removed user from group."});
    try {
      await logJoinEvent(isJoinEvent, email, group.id);
    } catch (error) {
      logger.error("Bigquery Error: ", {structuredData: true, error});
    }
    return;
  } catch (error) {
    logger.error("Error leaving group:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
