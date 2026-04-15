"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AssetEntry, AssetType, AssetSummary } from "@/lib/constants";

export function useAssets() {
  const [assets, setAssets] = useState<AssetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, "assets"), orderBy("timestamp", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs: AssetEntry[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AssetEntry, "id" | "timestamp">),
          timestamp: (d.data().timestamp as Timestamp).toDate(),
        }));
        setAssets(docs);
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
  }, []);

  return { assets, loading, error };
}

export function getAssetSummary(
  entries: AssetEntry[],
  type: AssetType,
): AssetSummary {
  const filteredEntries = entries.filter((e) => e.type === type);

  const summary: AssetSummary = {
    type,
    totalAmount: filteredEntries.reduce((sum, e) => sum + (e.amount || 0), 0),
    entriesCount: filteredEntries.length,
    latestUpdate: filteredEntries[0]?.timestamp,
  };

  if (type === "gold") {
    summary.totalCost = filteredEntries.reduce(
      (sum, e) => sum + (e.cost || 0),
      0,
    );
  }

  return summary;
}

export async function addAssetEntry(
  data: Omit<AssetEntry, "id" | "timestamp">,
  date: Date = new Date(),
) {
  return addDoc(collection(db, "assets"), {
    ...data,
    timestamp: Timestamp.fromDate(date),
  });
}

export async function updateAssetEntry(
  id: string,
  data: Partial<Omit<AssetEntry, "id" | "timestamp">>,
  date?: Date,
) {
  try {
    const docRef = doc(db, "assets", id);
    const updateData: Record<string, unknown> = { ...data };
    if (date) {
      updateData.timestamp = Timestamp.fromDate(date);
    }
    return await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("useAssets: updateAssetEntry error", error);
    throw error;
  }
}

export function getUniqueFundNames(assets: AssetEntry[]): string[] {
  const fundAssets = assets.filter((e) => e.type === "funds" && e.fundName);
  const uniqueNames = Array.from(new Set(fundAssets.map((e) => e.fundName as string)));
  return uniqueNames.sort();
}

export async function deleteAssetEntry(id: string) {
  try {
    return await deleteDoc(doc(db, "assets", id));
  } catch (error) {
    console.error("useAssets: deleteAssetEntry error", error);
    throw error;
  }
}
