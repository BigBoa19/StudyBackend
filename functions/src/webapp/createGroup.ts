import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {Firestore} from "firebase-admin/firestore";
import {createGroup} from "../helpers";

export const createGroupHandler = async (
  db: Firestore,
  req: Request,
  res: Response,
) => {
  logger.info("Received createGroup request", {structuredData: true});

  if (req.method !== "POST") {
    res.status(405).send({
      success: false,
      message: "Method Not Allowed. Please use POST.",
    });
    return;
  }

  const {group, email} = req.body;

  if (!group || !group.id) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. 'group' object with an 'id' is required.",
    });
    return;
  }

  try {
    await createGroup(db, group, email);
    res.status(200).send({
      success: true,
      message: "Group created successfully.",
    });
  } catch (error) {
    logger.error("Error creating group:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
