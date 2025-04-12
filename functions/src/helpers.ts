import {Firestore, FieldValue} from "firebase-admin/firestore";
import {userDetails, groupDetails} from "./types";

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
  group: groupDetails,
  email?: string,
): Promise<void> => {
  const groupDocPath = `Study Groups/${group.id}`;
  const groupDocRef = db.doc(groupDocPath);

  // Check if a group with this id already exists.
  const groupSnapshot = await groupDocRef.get();
  if (groupSnapshot.exists) {
    throw new Error(`Group with id ${group.id} already exists`);
  }

  await groupDocRef.set({
    ...group,
    participantDetails: group.participantDetails || [],
  });

  if (email) {
    const userDocPath = `Users/${email}`;
    const userDocRef = db.doc(userDocPath);
    await userDocRef.set(
      {
        joinedGroups: FieldValue.arrayUnion(group.id),
      },
      {merge: true},
    );
  }
};

export const isUserInGroup = (
  user: Partial<userDetails>,
  group: groupDetails,
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
  groupId: string,
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
      {merge: true},
    );
  } else {
    await userDocRef.set(
      {
        joinedGroups: FieldValue.arrayRemove(groupId),
      },
      {merge: true},
    );
  }
};

export const updateUserFields = async (db: Firestore,
  user: Partial<userDetails>): Promise<void> => {
  const filteredUpdates = Object.fromEntries(
    Object.entries(user).filter(([, value]) => value !== null)
  );
  const userDocPath = `Users/${user.email}`;
  const userDocRef = db.doc(userDocPath);
  await userDocRef.set(filteredUpdates, {merge: true});
};
