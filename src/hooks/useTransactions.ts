"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  where,
  limit,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Transaction } from "@/lib/constants";

const PAGE_SIZE = 30;

export function useTransactions(
  houseId: string,
  monthStart?: Date,
  monthEnd?: Date,
  createdBy?: string,
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!houseId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const constraints: Parameters<typeof query>[1][] = [
      orderBy("timestamp", "desc"),
    ];

    if (monthStart && monthEnd) {
      constraints.unshift(
        where("timestamp", ">=", Timestamp.fromDate(monthStart)),
        where("timestamp", "<=", Timestamp.fromDate(monthEnd)),
      );
    }

    if (createdBy) {
      constraints.push(where("createdBy", "==", createdBy));
    }

    const q = query(
      collection(db, "houses", houseId, "transactions"),
      ...constraints,
      limit(PAGE_SIZE),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: Transaction[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Transaction, "id" | "timestamp">),
          timestamp: (d.data().timestamp as Timestamp).toDate(),
        }));
        setTransactions(docs);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [houseId, monthStart, monthEnd, createdBy]);

  return { transactions, loading, error };
}

export async function addTransaction(
  houseId: string,
  data: Omit<Transaction, "id" | "timestamp" | "houseId">,
  date: Date = new Date(),
) {
  return addDoc(collection(db, "houses", houseId, "transactions"), {
    ...data,
    houseId,
    timestamp: Timestamp.fromDate(date),
  });
}

export async function updateTransaction(
  houseId: string,
  id: string,
  data: Partial<Omit<Transaction, "id" | "timestamp" | "houseId">>,
  date?: Date,
) {
  try {
    console.log("Updating transaction:", id, data);
    const docRef = doc(db, "houses", houseId, "transactions", id);
    const updateData: Record<string, unknown> = { ...data };
    if (date) {
      updateData.timestamp = Timestamp.fromDate(date);
    }
    return await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("useTransactions: updateTransaction error", error);
    throw error;
  }
}

export async function deleteTransaction(houseId: string, id: string) {
  try {
    console.log("Deleting transaction:", id);
    return await deleteDoc(doc(db, "houses", houseId, "transactions", id));;
  } catch (error) {
    console.error("useTransactions: deleteTransaction error", error);
    throw error;
  }
}
