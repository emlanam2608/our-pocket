"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Transaction } from "@/lib/constants";

const PAGE_SIZE = 30;

export function useTransactions(monthStart?: Date, monthEnd?: Date) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const constraints: Parameters<typeof query>[1][] = [orderBy("timestamp", "desc")];

    if (monthStart && monthEnd) {
      constraints.unshift(
        where("timestamp", ">=", Timestamp.fromDate(monthStart)),
        where("timestamp", "<=", Timestamp.fromDate(monthEnd))
      );
    }

    const q = query(collection(db, "transactions"), ...constraints, limit(PAGE_SIZE));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Transaction[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, "id" | "timestamp">),
          timestamp: (d.data().timestamp as any).toDate(),
        }));
        setTransactions(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        setLoading(false); // Stop loading even if it fails
      }
    );

    return unsub;
  }, [monthStart, monthEnd]);

  return { transactions, loading };
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "timestamp">,
  timestamp: Date
) {
  const ref = await addDoc(collection(db, "transactions"), {
    ...data,
    timestamp: Timestamp.fromDate(timestamp),
  });
  return ref.id;
}
