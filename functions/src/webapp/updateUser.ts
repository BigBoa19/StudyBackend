import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {userDetails} from "../types";
import {Firestore} from "firebase-admin/firestore";
import {logUpdateUserEvent} from "../bq/bqService";
import {
  updateUserFields,
} from "../helpers";

export const updateUser = async (
  db: Firestore,
  req: Request,
  res: Response,
) => {
  logger.info("Received updateUser request", {structuredData: true});
  if (req.method !== "POST") {
    res.status(405).send({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
    return;
  }
  const user: userDetails = {
    email: req.body.email,
    firstName: req.body.firstName ?? null,
    lastName: req.body.lastName ?? null,
    fullName: req.body.fullName ?? null,
    imageUrl: req.body.imageUrl ?? null,
    joinedGroups: req.body.joinedGroups ?? null,
    // Remove JoinedGroups later
    majors: req.body.majors ?? null,
    year: req.body.year ?? null,
  };
  if (!(user.email)) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. Field 'email' is required.",
    });
    return;
  }
  if (!(user.firstName || user.lastName ||
    user.fullName || user.imageUrl ||
    user.majors || user.year)) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. At least one user field is required.",
    });
    return;
  }

  try {
    await updateUserFields(db, user);
    await logUpdateUserEvent(user);
    res.status(200).send({success: true, message: "Added/Updated user."});
    return;
  } catch (error) {
    logger.error("Error adding/updating user:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
