"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Feeding } from "@/types/feeding";

interface FeedingDoc {
  familyId: string;
  babyName: string;
  amount: number;
  unit: "ml" | "oz";
  loggedBy: string;
  loggedByName: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useFeedings(familyId: string | undefined) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!familyId) return;

    const today = startOfDay(new Date());
    const feedingsRef = collection(db, "feedings");
    const q = query(
      feedingsRef,
      where("familyId", "==", familyId),
      where("timestamp", ">=", today),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: Feeding[] = snapshot.docs.map((doc) => {
          const data = doc.data() as FeedingDoc;
          return {
            id: doc.id,
            familyId: data.familyId,
            babyName: data.babyName,
            amount: data.amount,
            unit: data.unit,
            loggedBy: data.loggedBy,
            loggedByName: data.loggedByName,
            timestamp: data.timestamp.toDate(),
            createdAt: data.createdAt.toDate(),
          };
        });
        setFeedings(results);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [familyId]);

  const dailyTotalMl = feedings.reduce((sum, f) => sum + f.amount, 0);

  const lastFeeding = feedings.length > 0 ? feedings[0] : null;
  const timeSinceLastFeeding = lastFeeding
    ? Math.round((Date.now() - lastFeeding.timestamp.getTime()) / 60000)
    : null;

  return { feedings, isLoading, dailyTotalMl, lastFeeding, timeSinceLastFeeding };
}
