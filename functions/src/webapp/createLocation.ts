"use client";
import { useDispatch } from "react-redux";
import { useAppSelector } from "~/lib/hooks";
import { setIsEditGroupModalOpen } from "~/lib/features/uiSlice";
import { useEffect, useState } from "react";
import { db, usersRef } from "~/lib/api/firebaseConfig";
import {
  setDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  DocumentReference,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

export default function EditGroupModal() {
  const { user } = useUser();
  const userId = user?.emailAddresses[0]?.emailAddress;
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [purpose, setPurpose] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [seats, setSeats] = useState("");
  const [details, setDetails] = useState("");
  const [classes, setClasses] = useState<string[]>([]); // Define classes state

  const dispatch = useDispatch();
  const isOpen = useAppSelector((state) => state.ui.isEditGroupModalOpen);

  const handleClose = () => {
    dispatch(setIsEditGroupModalOpen(false));
  };

  async function checkId(docRef: DocumentReference): Promise<boolean> {
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < 20; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    let timestamp: Date;
    try {
      const [year, month, day] = date.split("-");
      const [hours, minutes] = time.split(":");
      timestamp = new Date(
        parseInt(year!),
        parseInt(month!) - 1,
        parseInt(day!),
        parseInt(hours!),
        parseInt(minutes!),
      );
    } catch (error) {
      return;
    }
    if (!timestamp) {
      toast.error("Invalid Date Input!");
      return;
    }

    let groupDocRef = doc(db, "Study Groups", id);
    while (await checkId(groupDocRef)) {
      id = "";
      for (let i = 0; i < 20; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      groupDocRef = doc(db, "Study Groups", id);
    }
    const firestoreTimestamp = Timestamp.fromDate(timestamp);
    await setDoc(groupDocRef, {
      id,
      title,
      course,
      purpose,
      startTime: firestoreTimestamp,
      location,
      totalSeats: Number(seats),
      participantDetails: [
        {
          name: user?.fullName,
          url: user?.imageUrl,
          email: user?.emailAddresses[0]?.emailAddress,
        },
      ],
      details,
    });
    const usersDocRef = doc(db, "Users", userId ? userId : "");
    await setDoc(
      usersDocRef,
      {
        joinedGroups: arrayUnion(id),
      },
      { merge: true },
    );

    setTitle("");
    setCourse("");
    setPurpose("");
    setDate("");
    setTime("");
    setLocation("");
    setSeats("");
    setDetails("");
    handleClose();

    toast("Study group edited successfully!", {
      icon: "👏",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    });
  };

  useEffect(() => {
    if (!user) return;
    const userId = user?.emailAddresses[0]?.emailAddress;
    const usersDocRef = doc(db, "Users", userId ? userId : "");
    const classesRef = collection(usersDocRef, "Classes");
    getDocs(classesRef).then((querySnapshot) => {
      const classList: string[] = [];
      querySnapshot.forEach((doc) => {
        classList.push(doc.id);
      });
      setClasses(classList);
    });
  }, [user]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-96 rounded-lg p-8 bg-lightAccent dark:bg-darkAccent">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">Edit Study Group</h2>
          <button onClick={handleClose} className="text-xl font-bold text-black dark:text-white">
            <big>&times;</big>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            className="mb-2 w-full rounded border p-2 bg-lightInput dark:bg-darkInput"
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            className="mb-2 w-full rounded border p-2 bg-lightInput dark:bg-darkInput"
            type="text"
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-500 w-full rounded bg-lightbg dark:bg-darkbg hover:bg-lightSelected dark:hover:bg-darkSelected px-4 py-2 font-bold text-black dark:text-white"
          >
            Edit Group
          </button>
        </form>
      </div>
    </div>
  );
}