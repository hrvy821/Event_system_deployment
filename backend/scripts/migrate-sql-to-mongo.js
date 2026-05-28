const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const dumpPath = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'event_db-4.sql'));
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'event_db';

if (!mongoUri) {
  console.error('Missing MONGODB_URI in backend/.env');
  process.exit(1);
}

function splitSqlList(input) {
  const values = [];
  let current = '';
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (quote) {
      current += char;
      if (char === '\\' && next) {
        current += next;
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (char === ',') {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) values.push(current.trim());
  return values;
}

function parseSqlValue(value) {
  if (/^null$/i.test(value)) return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  return value;
}

function extractTupleStrings(valuesBlock) {
  const tuples = [];
  let depth = 0;
  let start = -1;
  let quote = null;

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const char = valuesBlock[i];
    const next = valuesBlock[i + 1];

    if (quote) {
      if (char === '\\' && next) {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === '(') {
      if (depth === 0) start = i + 1;
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        tuples.push(valuesBlock.slice(start, i));
        start = -1;
      }
    }
  }

  return tuples;
}

function parseInserts(sql) {
  const insertRegex = /INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([\s\S]*?);/g;
  const rowsByTable = {};
  let match;

  while ((match = insertRegex.exec(sql)) !== null) {
    const [, table, columnBlock, valuesBlock] = match;
    const columns = columnBlock.split(',').map((column) => column.trim().replace(/`/g, ''));
    const tuples = extractTupleStrings(valuesBlock);

    rowsByTable[table] ||= [];

    for (const tuple of tuples) {
      const values = splitSqlList(tuple).map(parseSqlValue);
      const row = {};
      columns.forEach((column, index) => {
        row[column] = values[index];
      });
      rowsByTable[table].push(row);
    }
  }

  return rowsByTable;
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1';
}

function normalizeEmptyToNull(value) {
  return value === '' ? null : value;
}

function mapRows(rowsByTable) {
  return {
    users: (rowsByTable.user || []).map((row) => ({
      id: Number(row.id),
      name: row.name,
      role: row.role,
      isActive: normalizeBoolean(row.isActive),
      email: row.email,
      password: row.password,
      resetOtpExpires: asDate(row.resetOtpExpires),
      resetOtp: normalizeEmptyToNull(row.resetOtp),
      isArchived: normalizeBoolean(row.isArchived),
      archivedAt: asDate(row.archivedAt),
      createdAt: asDate(row.createdAt) || new Date(),
      updatedAt: asDate(row.updatedAt) || new Date(),
      username: normalizeEmptyToNull(row.username),
      avatarUrl: normalizeEmptyToNull(row.avatarUrl),
      eventReminders: true,
      bookingUpdates: true,
      marketingEmails: false,
      darkMode: false,
      pendingEmail: normalizeEmptyToNull(row.pendingEmail),
      pendingEmailOtp: normalizeEmptyToNull(row.pendingEmailOtp),
      pendingEmailOtpExpires: asDate(row.pendingEmailOtpExpires),
    })),
    events: (rowsByTable.event || []).map((row) => ({
      id: Number(row.id),
      title: row.title,
      date: String(row.date),
      time: String(row.time),
      location: row.location,
      category: row.category,
      description: row.description,
      price: String(row.price),
      announcement: row.announcement,
      organizerId: Number(row.organizerId),
      isArchived: normalizeBoolean(row.isArchived),
      imageUrl: normalizeEmptyToNull(row.imageUrl),
      bannerUrl: normalizeEmptyToNull(row.bannerUrl),
      capacity: Number(row.capacity || 0),
      status: row.status || 'Pending',
    })),
    attendees: (rowsByTable.attendee || []).map((row) => ({
      id: Number(row.id),
      name: row.name,
      email: row.email,
      company: normalizeEmptyToNull(row.company),
      eventId: String(row.eventId),
      status: row.status || 'Pending',
      ticketId: row.ticketId,
      amountPaid: String(row.amountPaid || '0'),
      checkedInAt: asDate(row.checkedInAt),
      createdAt: asDate(row.createdAt) || new Date(),
      updatedAt: asDate(row.updatedAt) || new Date(),
    })),
    notifications: (rowsByTable.notification || []).map((row) => ({
      id: Number(row.id),
      userId: Number(row.userId),
      title: row.title,
      message: row.message,
      type: row.type || 'SYSTEM',
      isRead: normalizeBoolean(row.isRead),
      createdAt: asDate(row.createdAt) || new Date(),
    })),
  };
}

async function replaceCollection(db, name, docs) {
  await db.collection(name).deleteMany({});
  if (docs.length > 0) {
    await db.collection(name).insertMany(docs, { ordered: false });
  }
  console.log(`${name}: imported ${docs.length} document(s)`);
}

async function createIndexes(db) {
  await db.collection('users').createIndex({ id: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex(
    { username: 1 },
    { unique: true, partialFilterExpression: { username: { $type: 'string' } } },
  );
  await db.collection('users').createIndex(
    { pendingEmail: 1 },
    { unique: true, partialFilterExpression: { pendingEmail: { $type: 'string' } } },
  );
  await db.collection('events').createIndex({ id: 1 }, { unique: true });
  await db.collection('events').createIndex({ organizerId: 1 });
  await db.collection('attendees').createIndex({ id: 1 }, { unique: true });
  await db.collection('attendees').createIndex({ eventId: 1 });
  await db.collection('attendees').createIndex({ ticketId: 1 });
  await db.collection('notifications').createIndex({ id: 1 }, { unique: true });
  await db.collection('notifications').createIndex({ userId: 1 });
}

async function main() {
  const sql = fs.readFileSync(dumpPath, 'utf8');
  const rowsByTable = parseInserts(sql);
  const collections = mapRows(rowsByTable);

  await mongoose.connect(mongoUri, { dbName });
  const db = mongoose.connection.db;

  for (const [name, docs] of Object.entries(collections)) {
    await replaceCollection(db, name, docs);
  }

  await createIndexes(db);
  await mongoose.disconnect();
  console.log(`Done. Imported SQL dump into MongoDB database "${dbName}".`);
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
