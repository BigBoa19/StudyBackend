import {
  Firestore,
  FieldValue,
} from "firebase-admin/firestore";
import {userDetails, groupDetails} from "./types";
import dotenv from "dotenv";
import Mailgun from "mailgun.js";
import FormData from "form-data";
import {firestore} from "firebase-admin";

export const fetchGroup = async (db: Firestore, id: string) => {
  const docPath = `Study Groups/${id}`;
  const docRef = db.doc(docPath);
  const docSnapshot = await docRef.get();
  return docSnapshot;
};

export const fetchUser = async (db: Firestore, email: string) => {
  const docPath = `Users/${email}`;
  const docRef = db.doc(docPath);
  const docSnapshot = await docRef.get();
  return docSnapshot;
};

export const createGroup = async (
  db: Firestore,
  group: Omit<groupDetails, "id">,
  email?: string
): Promise<string> => {
  const groupCollectionRef = db.collection("Study Groups");

  const groupData = {
    ...group,
    participantDetails: group.participantDetails || [],
  };

  const docRef = await groupCollectionRef.add(groupData);

  if (email) {
    const userDocPath = `Users/${email}`;
    const userDocRef = db.doc(userDocPath);
    await userDocRef.set(
      {
        joinedGroups: FieldValue.arrayUnion(docRef.id),
      },
      {merge: true}
    );
  }

  return docRef.id;
};

export const isUserInGroup = (
  user: Partial<userDetails>,
  group: groupDetails
): boolean => {
  if (!user.joinedGroups) {
    return false;
  }
  for (const joinedGroup of user.joinedGroups) {
    if (joinedGroup === group.id) {
      return true;
    }
  }
  return false;
};

export const isUserOwnerOfGroup = (
  email: string,
  group: groupDetails
): boolean => {
  if (!group.participantDetails) {
    return false;
  }
  return group.participantDetails[0].email == email;
};

export const isGroupFull = (group: groupDetails): boolean => {
  const numParticipants = group.participantDetails.length;
  const totalSeats = group.totalSeats;
  return numParticipants >= totalSeats;
};

export const updateGroupMembership = async (
  db: Firestore,
  isJoinEvent: boolean,
  email: string,
  user: Partial<userDetails>,
  groupId: string
): Promise<void> => {
  const groupDocPath = `Study Groups/${groupId}`;
  const groupDocRef = db.doc(groupDocPath);
  const entryToUpdate = {
    name: user?.fullName ?? "Unknown",
    url: user?.imageUrl ?? "",
    email: email,
  };
  if (isJoinEvent) {
    await groupDocRef.update({
      participantDetails: FieldValue.arrayUnion(entryToUpdate),
    });
  } else {
    await groupDocRef.update({
      participantDetails: FieldValue.arrayRemove(entryToUpdate),
    });
  }
  const userDocPath = `Users/${email}`;
  const userDocRef = db.doc(userDocPath);
  if (isJoinEvent) {
    await userDocRef.set(
      {
        joinedGroups: FieldValue.arrayUnion(groupId),
      },
      {merge: true}
    );
  } else {
    await userDocRef.set(
      {
        joinedGroups: FieldValue.arrayRemove(groupId),
      },
      {merge: true}
    );
  }
};

export const updateGroupFields = async (
  groupDocRef: firestore.DocumentReference,
  location: string,
  details: string
): Promise<void> => {
  const updateFields: any = {};
  if (location) updateFields.location = location;
  if (details) updateFields.details = details;
  await groupDocRef.update(updateFields);
};

export const updateUserFields = async (
  db: Firestore,
  user: Partial<userDetails>
): Promise<void> => {
  const filteredUpdates = Object.fromEntries(
    Object.entries(user).filter(([, value]) => value !== null)
  );
  const userDocPath = `Users/${user.email}`;
  const userDocRef = db.doc(userDocPath);
  await userDocRef.set(filteredUpdates, {merge: true});
};

export const sendSimpleMessageTemplate = async (group: groupDetails) => {
  dotenv.config();
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAILGUN_KEY || "",
  });

  try {
    const participantsList = group.participantDetails
      .map(
        (p) =>
          `<div style="margin-bottom: 10px;">
        <img src="${p.url}" alt="${p.name}'s profile" style="width: 50px;
        height: 50px; 
        border-radius: 50%; margin-right: 10px; vertical-align: middle;">
        <span style="vertical-align: middle;">${p.name} (${p.email})</span>
      </div>`
      )
      .join("");

    const htmlContent = `
      <h2>Study Group Reminder: ${group.title}</h2>
      <p><strong>Course:</strong> ${group.course}</p>
      <p><strong>Location:</strong> ${group.location}</p>
      <p><strong>Purpose:</strong> ${group.purpose}</p>
      <p><strong>Start Time:</strong> ${group.startTime
    .toDate()
    .toLocaleString()}</p>
      <h3>Participants:</h3>
      ${participantsList}
    `;

    const data = await mg.messages.create("scottylabs.org", {
      from: "Mailgun Sandbox <postmaster@scottylabsm.org>",
      to: group.participantDetails.map(
        (participant) => `${participant.name}
       <${participant.email}>`
      ),
      subject: `Study Group Reminder: ${group.title}`,
      html: htmlContent,
    });
    console.log(data);
  } catch (error) {
    console.log(error);
  }
};
