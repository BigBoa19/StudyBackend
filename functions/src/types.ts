import {Timestamp} from "firebase-admin/firestore";

export interface groupDetails {
  title: string;
  id: string;
  totalSeats: number;
  location: string;
  purpose: string;
  startTime: Timestamp;
  course: string;
  participantDetails: {
    name: string;
    url: string;
    email: string;
  }[];
  details: string;
}

// interface courseDetails {
//   courseId: string;
//   id: string;
//   name: string;
// }

export interface userDetails {
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  imageUrl: string | null;
  joinedGroups: string[] | null;
  majors: string | null;
  year: string | null;
}

export interface createGroupInterface {
  email: string;
  group: Omit<groupDetails, "id" | "participantDetails | startTime">;
  tstamp: number
}
