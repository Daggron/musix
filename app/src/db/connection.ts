import {open} from '@op-engineering/op-sqlite';
import type {DB} from '@op-engineering/op-sqlite';

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) {
    _db = open({name: 'musix.db'});
  }
  return _db;
}
