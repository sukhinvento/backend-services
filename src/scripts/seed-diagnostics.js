/**
 * Seed script: Diagnostic Bookings
 * Run: node src/scripts/seed-diagnostics.js
 */

const BASE = 'http://localhost:3000';

async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': 'default_tenant',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json().catch(() => null);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

async function deleteAll(path, token) {
  try {
    const raw = await api('GET', `${path}?limit=200`, null, token);
    const items = Array.isArray(raw) ? raw : raw?.data ?? [];
    let count = 0;
    for (const item of items) {
      try { await api('DELETE', `${path}/${item._id}`, null, token); count++; } catch (_) {}
    }
    return count;
  } catch (_) { return 0; }
}

async function main() {
  console.log('🔑 Logging in…');
  const auth = await api('POST', '/auth/login', { username: 'admin@company.com', password: 'Admin123!' });
  const token = auth.access_token;
  if (!token) throw new Error('Login failed');
  console.log('✅ Logged in\n');

  // Fetch real patients, doctors, tests
  console.log('📦 Fetching seed data…');
  const patientsRaw = await api('GET', '/patients?limit=50', null, token);
  const patients = (Array.isArray(patientsRaw) ? patientsRaw : patientsRaw?.data ?? []).map(p => ({
    id: p._id, name: p.name || p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim()
  }));

  const doctorsRaw = await api('GET', '/doctors?limit=50', null, token);
  const doctors = (Array.isArray(doctorsRaw) ? doctorsRaw : doctorsRaw?.data ?? []).map(d => ({
    id: d._id, name: d.name || d.full_name, department: d.department
  }));

  const testsRaw = await api('GET', '/diagnostics/tests?limit=100', null, token);
  const tests = (Array.isArray(testsRaw) ? testsRaw : testsRaw?.data ?? []).map(t => ({
    id: t._id, name: t.name, category: t.category, price: t.price,
    department: t.department
  }));

  console.log(`   Patients: ${patients.length}, Doctors: ${doctors.length}, Tests: ${tests.length}`);
  if (!patients.length || !doctors.length || !tests.length) {
    throw new Error('Missing seed dependencies. Ensure patients, doctors and tests exist first.');
  }

  // Clean existing bookings
  console.log('\n🧹 Cleaning existing diagnostic bookings…');
  const removed = await deleteAll('/diagnostics/bookings', token);
  console.log(`   Removed ${removed} bookings`);

  // Group tests by category for variety
  const byCategory = {};
  for (const t of tests) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  // Helper to pick random item
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // Booking definitions: [daysAgoOrdered, status, priority, category, scheduledOffset]
  // scheduledOffset: days from ordered_date to scheduled_date
  const bookingDefs = [
    // Completed (historical)
    { dayAgo: 45, status: 'completed', priority: 'routine',   cat: 'Haematology',   sched: 2, completedOffset: 1 },
    { dayAgo: 40, status: 'completed', priority: 'urgent',    cat: 'Biochemistry',  sched: 1, completedOffset: 1 },
    { dayAgo: 35, status: 'completed', priority: 'routine',   cat: 'Radiology',     sched: 3, completedOffset: 1 },
    { dayAgo: 30, status: 'completed', priority: 'routine',   cat: 'Pathology',     sched: 2, completedOffset: 1 },
    { dayAgo: 28, status: 'completed', priority: 'emergency', cat: 'Cardiology',    sched: 0, completedOffset: 0 },
    { dayAgo: 25, status: 'completed', priority: 'routine',   cat: 'Biochemistry',  sched: 2, completedOffset: 2 },
    { dayAgo: 22, status: 'completed', priority: 'urgent',    cat: 'Microbiology',  sched: 1, completedOffset: 2 },
    { dayAgo: 18, status: 'completed', priority: 'routine',   cat: 'Haematology',   sched: 1, completedOffset: 1 },
    { dayAgo: 15, status: 'completed', priority: 'routine',   cat: 'Radiology',     sched: 2, completedOffset: 1 },
    { dayAgo: 12, status: 'completed', priority: 'urgent',    cat: 'Biochemistry',  sched: 1, completedOffset: 1 },
    // In Progress
    { dayAgo: 3,  status: 'in_progress', priority: 'routine',   cat: 'Pathology',   sched: 0, completedOffset: null },
    { dayAgo: 2,  status: 'in_progress', priority: 'urgent',    cat: 'Haematology', sched: 0, completedOffset: null },
    { dayAgo: 1,  status: 'in_progress', priority: 'emergency', cat: 'Cardiology',  sched: 0, completedOffset: null },
    // Scheduled (upcoming)
    { dayAgo: 1,  status: 'scheduled', priority: 'routine',   cat: 'Biochemistry',   sched: 2,  completedOffset: null },
    { dayAgo: 0,  status: 'scheduled', priority: 'routine',   cat: 'Radiology',      sched: 3,  completedOffset: null },
    { dayAgo: 0,  status: 'scheduled', priority: 'urgent',    cat: 'Microbiology',   sched: 1,  completedOffset: null },
    { dayAgo: 0,  status: 'scheduled', priority: 'routine',   cat: 'Haematology',    sched: 4,  completedOffset: null },
    { dayAgo: 0,  status: 'scheduled', priority: 'routine',   cat: 'Biochemistry',   sched: 5,  completedOffset: null },
    // Pending (ordered, not yet scheduled)
    { dayAgo: 1,  status: 'pending', priority: 'routine',   cat: 'Radiology',     sched: null, completedOffset: null },
    { dayAgo: 0,  status: 'pending', priority: 'urgent',    cat: 'Biochemistry',  sched: null, completedOffset: null },
    { dayAgo: 0,  status: 'pending', priority: 'routine',   cat: 'Microbiology',  sched: null, completedOffset: null },
    // Cancelled
    { dayAgo: 20, status: 'cancelled', priority: 'routine', cat: 'Radiology',     sched: 3,  completedOffset: null },
    { dayAgo: 10, status: 'cancelled', priority: 'urgent',  cat: 'Haematology',   sched: 2,  completedOffset: null },
  ];

  console.log('\n🧪 Creating diagnostic bookings…');
  let created = 0;
  for (let i = 0; i < bookingDefs.length; i++) {
    const def = bookingDefs[i];
    const patient = patients[i % patients.length];
    const doctor  = doctors[i % doctors.length];
    const testPool = byCategory[def.cat] || tests;
    const test = pick(testPool);

    const orderedDate = daysAgo(def.dayAgo);

    const getScheduledDate = () => {
      if (def.sched === null) return undefined;
      if (def.status === 'completed' || def.status === 'in_progress') {
        // scheduled before ordered+sched, already in past
        const d = new Date(orderedDate);
        d.setDate(d.getDate() + def.sched);
        return d.toISOString().split('T')[0];
      }
      // future
      return daysFromNow(def.sched);
    };

    const scheduledDate = getScheduledDate();

    const getCompletedDate = () => {
      if (def.completedOffset === null || def.completedOffset === undefined) return undefined;
      const d = new Date(scheduledDate || orderedDate);
      d.setDate(d.getDate() + def.completedOffset);
      return d.toISOString().split('T')[0];
    };

    const body = {
      patient_id: patient.id,
      test_id: test.id,
      test_name: test.name,
      category: test.category,
      ordered_by_doctor_id: doctor.id,
      ordered_date: orderedDate,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledDate ? '09:00' : undefined,
      completed_date: getCompletedDate(),
      status: def.status,
      priority: def.priority,
      price: test.price,
      notes: def.priority === 'emergency' ? 'Emergency — process immediately' : def.priority === 'urgent' ? 'Urgent processing required' : undefined,
      results: def.status === 'completed' ? 'Results within normal range. No significant abnormalities detected.' : undefined,
    };

    try {
      await api('POST', '/diagnostics/bookings', body, token);
      console.log(`   ✅ [${def.status.toUpperCase()}] ${patient.name} — ${test.name} (${def.priority})`);
      created++;
    } catch (e) {
      console.error(`   ❌ ${e.message.slice(0, 80)}`);
    }
  }

  console.log(`\n✅ Seed complete! Created ${created} diagnostic bookings.\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
