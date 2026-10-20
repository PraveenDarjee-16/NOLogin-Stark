import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage';
import { StorageStats, FileCategory } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const files = await db.getFiles();
  const folders = await db.getFolders();
  const preferences = await db.getPreferences();
  const { type: storageProviderType } = getStorageProvider();

  const capacityGB =
    Number(process.env.STORAGE_CAPACITY_GB) ||
    preferences.storageCapacityGB ||
    15;
  const totalCapacityBytes = capacityGB * 1024 * 1024 * 1024;

  let usedBytes = 0;
  const byCategory: StorageStats['byCategory'] = {
    documents: { bytes: 0, count: 0 },
    photos: { bytes: 0, count: 0 },
    videos: { bytes: 0, count: 0 },
    music: { bytes: 0, count: 0 },
    downloads: { bytes: 0, count: 0 },
    other: { bytes: 0, count: 0 },
    trash: { bytes: 0, count: 0 },
  };

  for (const f of files) {
    const size = f.size || 0;
    usedBytes += size;

    if (f.isTrash) {
      byCategory.trash.bytes += size;
      byCategory.trash.count += 1;
    } else {
      const cat = (f.category || 'other') as FileCategory;
      if (byCategory[cat]) {
        byCategory[cat].bytes += size;
        byCategory[cat].count += 1;
      } else {
        byCategory.other.bytes += size;
        byCategory.other.count += 1;
      }
    }
  }

  const remainingBytes = Math.max(0, totalCapacityBytes - usedBytes);
  const usedPercentage = Math.min(
    100,
    parseFloat(((usedBytes / totalCapacityBytes) * 100).toFixed(1))
  );

  const stats: StorageStats = {
    totalCapacityBytes,
    usedBytes,
    remainingBytes,
    usedPercentage,
    totalFiles: files.filter((f) => !f.isTrash).length,
    totalFolders: folders.filter((f) => !f.isTrash).length,
    byCategory,
    storageProvider: storageProviderType,
  };

  return NextResponse.json(stats);
}
