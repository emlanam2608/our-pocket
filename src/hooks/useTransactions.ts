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
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Transaction } from "@/lib/constants";

const PAGE_SIZE = 30;

export function useTransactions(monthStart?: Date, monthEnd?: Date) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setError(null);
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
      (err) => {
        console.error("Firestore subscription error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  }, [monthStart, monthEnd]);

  return { transactions, loading, error };
}

export async function addTransaction(
  data: Omit<Transaction, "id" | "timestamp">,
  date: Date = new Date()
) {
  return addDoc(collection(db, "transactions"), {
    ...data,
    timestamp: Timestamp.fromDate(date),
  });
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "timestamp">>,
  date?: Date
) {
  try {
    console.log("Updating transaction:", id, data);
    const docRef = doc(db, "transactions", id);
    const updateData: any = { ...data };
    if (date) {
      updateData.timestamp = Timestamp.fromDate(date);
    }
    return await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("useTransactions: updateTransaction error", error);
    throw error;
  }
}

export async function deleteTransaction(id: string) {
  try {
    console.log("Deleting transaction:", id);
    return await deleteDoc(doc(db, "transactions", id));
  } catch (error) {
    console.error("useTransactions: deleteTransaction error", error);
    throw error;
  }
}
