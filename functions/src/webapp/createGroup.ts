import {Request, Response} from "express";
import * as logger from "firebase-functions/logger";
import {Firestore, Timestamp} from "firebase-admin/firestore";
import {createGroup} from "../helpers";
import {createCloudTask} from "../util/scheduleEmail";
import {createGroupInterface} from "../types";

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


  const {email, group, tstamp} = req.body as createGroupInterface;
  if (!group) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. 'group' object is required.",
    });
    return;
  }

  if (!tstamp) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. 'tstamp' (in ms) is required.",
    });
    return;
  }

  if (
    group.course == null ||
    group.location == null ||
    group.purpose == null ||
    group.title == null ||
    group.totalSeats == null
  ) {
    res.status(400).send({
      success: false,
      message: "Invalid payload. missing fields inside 'group'.",
    });
  }
  try {
    const groupId = await createGroup(db, group, tstamp, email);
    res.status(200).send({
      success: true,
      message: "Group created successfully.",
      groupId: groupId,
    });
    const startTime: Timestamp = group.startTime;
    await createCloudTask(groupId, tstamp);
  } catch (error) {
    logger.error("Error creating group:", {structuredData: true, error});
    res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
