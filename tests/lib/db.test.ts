import 'fake-indexeddb/auto';
import { DB } from '@/lib/graph-db';
import { describe, expect, it } from 'vitest';

describe('test IndexedDB', () => {
  it('works', () => {
    const db = new DB();
    expect(db).instanceOf(DB);
  });
});
