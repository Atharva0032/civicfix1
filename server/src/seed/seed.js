import env from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Notification from '../models/Notification.js';
import {
  CATEGORY_BASE_PRIORITY,
  CATEGORY_DEPARTMENT,
  ISSUE_STATUS,
  ROLES,
} from '../utils/constants.js';
import { priorityWeightOf } from '../services/issue.service.js';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

let seedState = 42;
/** Tiny deterministic PRNG so every demo run produces the same dataset. */
const rand = () => {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296;
  return seedState / 4294967296;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

const DAY = 24 * 60 * 60 * 1000;
const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000);

const photo = (prompt, size = 'landscape_4_3') => ({
  url: `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    prompt,
  )}&image_size=${size}`,
  publicId: '',
  uploadedAt: new Date(),
});

/* -------------------------------------------------------------------------- */
/*  Accounts                                                                   */
/* -------------------------------------------------------------------------- */

const CITIZENS = [
  { name: 'Ananya Deshmukh', email: 'ananya@civicfix.dev', phone: '+91 98220 11223' },
  { name: 'Rohan Kulkarni', email: 'rohan@civicfix.dev', phone: '+91 98220 44556' },
  { name: 'Meera Iyer', email: 'meera@civicfix.dev', phone: '+91 98220 77889' },
  { name: 'Imran Sheikh', email: 'imran@civicfix.dev', phone: '+91 98220 33445' },
];

const ADMIN = {
  name: 'admin',
  email: 'admin@civicfix.dev',
  phone: '+91 20 2550 1000',
  department: 'General Administration',
};

const DEPARTMENT_OFFICERS = [
  { name: 'Vikram Rao', email: 'officer.roads@civicfix.dev', department: 'Public Works Department' },
  { name: 'Sunita Patil', email: 'officer.sanitation@civicfix.dev', department: 'Sanitation & Solid Waste' },
];

/* -------------------------------------------------------------------------- */
/*  Complaints — realistic civic reports across Pune                            */
/* -------------------------------------------------------------------------- */

const COMPLAINTS = [
  {
    title: 'Large pothole near Shivaji Nagar bus stand',
    description:
      'A deep pothole has formed right at the bus bay entry. Two-wheelers are swerving into the fast lane to avoid it and it fills with water after every shower. It has been like this for over three weeks now.',
    category: 'roads',
    address: 'Shivaji Nagar Bus Stand, Platform Road',
    area: 'Shivaji Nagar',
    city: 'Pune',
    pincode: '411005',
    lat: 18.5308,
    lng: 73.8474,
    status: ISSUE_STATUS.IN_PROGRESS,
    photoPrompt: 'deep pothole filled with rainwater on an Indian city road, cars swerving around it',
    ageHours: 26 * 24,
  },
  {
    title: 'Garbage bins overflowing behind Market Yard',
    description:
      'The community bins behind Market Yard have not been cleared for five days. Waste is spilling onto the footpath and stray animals are scattering it across the road. The smell is unbearable for shopkeepers.',
    category: 'garbage',
    address: 'Market Yard Gate No. 3, Gultekdi',
    area: 'Gultekdi',
    city: 'Pune',
    pincode: '411037',
    lat: 18.4908,
    lng: 73.8709,
    status: ISSUE_STATUS.ACKNOWLEDGED,
    photoPrompt: 'overflowing municipal garbage bins on an Indian street with scattered waste on the footpath',
    ageHours: 4 * 24,
  },
  {
    title: 'Streetlight dark for entire stretch on Sinhagad Road',
    description:
      'Six consecutive streetlight poles between Nanded City and Vitthalwadi are not working. The stretch is completely dark after 7 pm and women commuters are avoiding it. Please repair the poles or replace the fittings.',
    category: 'electricity',
    address: 'Sinhagad Road, near Vitthalwadi Junction',
    area: 'Vitthalwadi',
    city: 'Pune',
    pincode: '411030',
    lat: 18.4665,
    lng: 73.8223,
    status: ISSUE_STATUS.SUBMITTED,
    photoPrompt: 'dark unlit street at night in an Indian residential locality',
    ageHours: 30,
  },
  {
    title: 'Water pipeline leakage wasting drinking water',
    description:
      'A main supply line has been leaking continuously near the school gate for almost a fortnight. Thousands of litres are being wasted every day and the road surface is starting to cave in.',
    category: 'water',
    address: 'Near Modern High School, Karve Nagar',
    area: 'Karve Nagar',
    city: 'Pune',
    pincode: '411052',
    lat: 18.4877,
    lng: 73.8118,
    status: ISSUE_STATUS.RESOLVED,
    photoPrompt: 'burst water pipeline leaking on an Indian city street, water gushing over the road',
    ageHours: 40 * 24,
  },
  {
    title: 'Open storm-water drain outside primary school',
    description:
      'The drain cover outside the school gate is missing. Children walk over the open gutter every morning. This is an accident waiting to happen and needs an immediate barricade and a new cover.',
    category: 'public_safety',
    address: 'Zilla Parishad Primary School, Kothrud',
    area: 'Kothrud',
    city: 'Pune',
    pincode: '411038',
    lat: 18.5074,
    lng: 73.8077,
    status: ISSUE_STATUS.IN_PROGRESS,
    photoPrompt: 'open storm water drain without cover beside a school footpath in India',
    ageHours: 9 * 24,
  },
  {
    title: 'Sewage overflow on Aundh main road',
    description:
      'The manhole on the main road has been overflowing since the weekend. Sewage is flowing into the shop fronts and the road has become slippery. Pedestrians are forced to walk on the carriageway.',
    category: 'drainage',
    address: 'Aundh Main Road, opposite Bremen Chowk',
    area: 'Aundh',
    city: 'Pune',
    pincode: '411007',
    lat: 18.5626,
    lng: 73.8077,
    status: ISSUE_STATUS.ACKNOWLEDGED,
    photoPrompt: 'overflowing sewage manhole on an Indian city road with dirty water spreading',
    ageHours: 3 * 24 + 6,
  },
  {
    title: 'Road caved in after digging work in Baner',
    description:
      'Contractors dug up the road for a cable laying project two months ago and never restored the surface. It is now a trench with loose gravel. Two scooters have already skidded here.',
    category: 'roads',
    address: 'Baner Road, near Balewadi High Street',
    area: 'Baner',
    city: 'Pune',
    pincode: '411045',
    lat: 18.5679,
    lng: 73.7775,
    status: ISSUE_STATUS.REJECTED,
    rejectionReason:
      'This stretch falls under the Pimpri-Chinchwad Municipal Corporation limits. The complaint has been forwarded to PCMCs road department.',
    photoPrompt: 'unrestored road trench with loose gravel and rubble on an Indian street',
    ageHours: 18 * 24,
  },
  {
    title: 'Garbage dump blocking footpath near railway station',
    description:
      'A pile of construction debris and household waste has been dumped on the footpath outside the station. Commuters have to step onto the main road to get around it.',
    category: 'garbage',
    address: 'Pune Railway Station, south exit footpath',
    area: 'Agarkar Nagar',
    city: 'Pune',
    pincode: '411001',
    lat: 18.5290,
    lng: 73.8743,
    status: ISSUE_STATUS.RESOLVED,
    photoPrompt: 'construction debris and household waste dumped on an Indian city footpath',
    ageHours: 33 * 24,
  },
  {
    title: 'Flickering streetlight causing visibility issues',
    description:
      'The streetlight at the corner of the society gate flickers constantly and goes off for long stretches. Senior citizens find it difficult to walk to the park in the evening.',
    category: 'electricity',
    address: 'Sahakari Vasahat Road, Gokhalenagar',
    area: 'Gokhalenagar',
    city: 'Pune',
    pincode: '411016',
    lat: 18.5224,
    lng: 73.8334,
    status: ISSUE_STATUS.RESOLVED,
    photoPrompt: 'flickering streetlight on a residential street in India at dusk',
    ageHours: 21 * 24,
  },
  {
    title: 'Contaminated water supply with muddy colour',
    description:
      'For the last four days the tap water in our lane is brown and smells odd. Residents are buying tankers. Requesting the board to flush the line and test the quality.',
    category: 'water',
    address: 'Ward 12, Bibwewadi',
    area: 'Bibwewadi',
    city: 'Pune',
    pincode: '411037',
    lat: 18.4753,
    lng: 73.8594,
    status: ISSUE_STATUS.IN_PROGRESS,
    photoPrompt: 'muddy brown tap water in a steel bucket, water quality complaint',
    ageHours: 5 * 24 + 4,
  },
  {
    title: 'Broken speed breaker outside hospital gate',
    description:
      'The speed breaker outside the hospital emergency entrance has crumbled and now has sharp edges. Ambulances are slowing down too much and two-wheelers are getting deflated.',
    category: 'public_safety',
    address: 'Sassoon General Hospital, emergency gate',
    area: 'Agarkar Nagar',
    city: 'Pune',
    pincode: '411001',
    lat: 18.5257,
    lng: 73.8728,
    status: ISSUE_STATUS.SUBMITTED,
    photoPrompt: 'broken and crumbled speed breaker with sharp edges on an Indian city road',
    ageHours: 14,
  },
  {
    title: 'Drainage chamber cover missing in lane',
    description:
      'A drainage chamber cover has been stolen from the lane behind the vegetable market. It has been open for a week. Requesting urgent replacement with a locking cover.',
    category: 'drainage',
    address: 'Lane behind Mahatma Phule Market',
    area: 'Ravivar Peth',
    city: 'Pune',
    pincode: '411002',
    lat: 18.5141,
    lng: 73.8567,
    status: ISSUE_STATUS.ACKNOWLEDGED,
    photoPrompt: 'missing drainage chamber cover leaving an open hole in an Indian city lane',
    ageHours: 6 * 24,
  },
  {
    title: 'Illegal debris dumping near riverbank',
    description:
      'A truck has been dumping construction debris on the riverbank at night. It is blocking the walking track and will worsen the flooding situation this monsoon.',
    category: 'other',
    address: 'Mula-Mutha riverbank, near Bund Garden',
    area: 'Bund Garden',
    city: 'Pune',
    pincode: '411001',
    lat: 18.5350,
    lng: 73.8760,
    status: ISSUE_STATUS.SUBMITTED,
    photoPrompt: 'illegal construction debris dumped along an Indian riverbank walking track',
    ageHours: 9,
  },
  {
    title: 'Uneven road patch causing accidents in Hadapsar',
    description:
      'A badly finished patch left by the utility department is two inches higher than the road. Motorcycles lose balance when crossing it, especially at night.',
    category: 'roads',
    address: 'Hadapsar Industrial Estate Road',
    area: 'Hadapsar',
    city: 'Pune',
    pincode: '411013',
    lat: 18.5089,
    lng: 73.9260,
    status: ISSUE_STATUS.IN_PROGRESS,
    photoPrompt: 'uneven asphalt patch raised above the road surface on an Indian street',
    ageHours: 12 * 24,
  },
  {
    title: 'Garbage collection skipped for a week in society',
    description:
      'The collection vehicle has not visited our society since last Tuesday. Bins are overflowing and the society is forced to burn waste in the open.',
    category: 'garbage',
    address: 'Sunrise Residency, Pimple Saudagar',
    area: 'Pimple Saudagar',
    city: 'Pune',
    pincode: '411027',
    lat: 18.5993,
    lng: 73.7981,
    status: ISSUE_STATUS.RESOLVED,
    photoPrompt: 'overflowing society garbage bins waiting for collection in India',
    ageHours: 48 * 24,
  },
  {
    title: 'Transformer sparking during rain',
    description:
      'The distribution transformer near the chowk sparks whenever it rains and there is a strong burning smell. Residents are worried about a fire. Please inspect urgently.',
    category: 'electricity',
    address: 'Nal Stop Chowk, Erandwane',
    area: 'Erandwane',
    city: 'Pune',
    pincode: '411004',
    lat: 18.5068,
    lng: 73.8255,
    status: ISSUE_STATUS.IN_PROGRESS,
    photoPrompt: 'electrical distribution transformer on an Indian street pole during rain',
    ageHours: 2 * 24 + 3,
  },
  {
    title: 'Footpath encroached by vendors near college',
    description:
      'Hawkers have occupied the entire footpath outside the college gate, forcing students to walk on the road during peak traffic hours.',
    category: 'public_safety',
    address: 'Fergusson College Road, near main gate',
    area: 'Shivaji Nagar',
    city: 'Pune',
    pincode: '411004',
    lat: 18.5204,
    lng: 73.8411,
    status: ISSUE_STATUS.SUBMITTED,
    photoPrompt: 'street vendors occupying the footpath outside a college gate in India',
    ageHours: 50,
  },
  {
    title: 'Waterlogged underpass after heavy rain',
    description:
      'The underpass floods up to two feet after every heavy shower and stays waterlogged for hours. There is no working pump and no depth marking board.',
    category: 'drainage',
    address: 'Range Hills Underpass, Khadki',
    area: 'Khadki',
    city: 'Pune',
    pincode: '411020',
    lat: 18.5620,
    lng: 73.8780,
    status: ISSUE_STATUS.REJECTED,
    rejectionReason:
      'Duplicate of an existing monsoon action-plan complaint for this underpass. Tracked under CIV-PENDING-2201 by the drainage department.',
    photoPrompt: 'flooded road underpass with stagnant water after heavy rain in an Indian city',
    ageHours: 11 * 24,
  },
];

/* -------------------------------------------------------------------------- */
/*  Timeline builders                                                          */
/* -------------------------------------------------------------------------- */

/** Produces a believable status history + timestamps for a seeded complaint. */
function buildTimeline({ status, createdAt, citizenName, adminName, reason }) {
  const history = [
    {
      status: ISSUE_STATUS.SUBMITTED,
      note: 'Complaint filed by citizen.',
      changedByName: citizenName,
      changedAt: createdAt,
    },
  ];

  const steps = {
    [ISSUE_STATUS.SUBMITTED]: [],
    [ISSUE_STATUS.ACKNOWLEDGED]: [
      { status: ISSUE_STATUS.ACKNOWLEDGED, note: 'Complaint verified and forwarded to the concerned department.' },
    ],
    [ISSUE_STATUS.IN_PROGRESS]: [
      { status: ISSUE_STATUS.ACKNOWLEDGED, note: 'Complaint verified and forwarded to the concerned department.' },
      { status: ISSUE_STATUS.IN_PROGRESS, note: 'Field team assigned. Work order issued.' },
    ],
    [ISSUE_STATUS.RESOLVED]: [
      { status: ISSUE_STATUS.ACKNOWLEDGED, note: 'Complaint verified and forwarded to the concerned department.' },
      { status: ISSUE_STATUS.IN_PROGRESS, note: 'Field team assigned. Work order issued.' },
      { status: ISSUE_STATUS.RESOLVED, note: 'Work completed on site and verified by the ward inspector.' },
    ],
    [ISSUE_STATUS.REJECTED]: [
      { status: ISSUE_STATUS.REJECTED, note: reason || 'Rejected after site inspection.' },
    ],
  };

  let cursor = createdAt.getTime();
  const totalSpan = Date.now() - cursor;

  (steps[status] || []).forEach((step, index, all) => {
    cursor += Math.max(totalSpan / (all.length + 1), 3 * 60 * 60 * 1000) * (1 + index * 0.15);
    if (cursor > Date.now()) cursor = Date.now();
    history.push({ ...step, changedByName: adminName, changedAt: new Date(cursor) });
  });

  return history;
}

const timestampsFor = (history) => {
  const at = (status) => history.find((entry) => entry.status === status)?.changedAt ?? null;
  return {
    acknowledgedAt: at(ISSUE_STATUS.ACKNOWLEDGED),
    startedAt: at(ISSUE_STATUS.IN_PROGRESS),
    resolvedAt: at(ISSUE_STATUS.RESOLVED),
    lastActivityAt: history[history.length - 1].changedAt,
  };
};

/* -------------------------------------------------------------------------- */
/*  Runner                                                                     */
/* -------------------------------------------------------------------------- */

async function seed({ fresh = false } = {}) {
  const password = env.seedDefaultPassword;

  if (fresh) {
    await Promise.all([
      User.deleteMany({}),
      Issue.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    // eslint-disable-next-line no-console
    console.log('[seed] Cleared existing users, complaints and notifications.');
  }

  /* --- Users ------------------------------------------------------------- */
  const existingAdmin = await User.findOne({ email: ADMIN.email });
  const admin =
    existingAdmin ||
    (await User.create({
      ...ADMIN,
      role: ROLES.ADMIN,
      password,
    }));

  const officers = [];
  for (const officer of DEPARTMENT_OFFICERS) {
    const existing = await User.findOne({ email: officer.email });
    officers.push(
      existing ||
        (await User.create({ ...officer, role: ROLES.ADMIN, password })),
    );
  }

  const citizens = [];
  for (const citizen of CITIZENS) {
    const existing = await User.findOne({ email: citizen.email });
    citizens.push(
      existing || (await User.create({ ...citizen, role: ROLES.CITIZEN, password })),
    );
  }

  /* --- Complaints -------------------------------------------------------- */
  let created = 0;
  const seededIssues = [];

  for (const spec of COMPLAINTS) {
    const alreadyPresent = await Issue.exists({ title: spec.title });
    if (alreadyPresent) continue;

    const citizen = pick(citizens);
    const createdAt = hoursAgo(spec.ageHours);
    const history = buildTimeline({
      status: spec.status,
      createdAt,
      citizenName: citizen.name,
      adminName: admin.name,
      reason: spec.rejectionReason,
    });
    const timeline = timestampsFor(history);
    const priority = CATEGORY_BASE_PRIORITY[spec.category] || 'medium';

    // A random subset of the *other* citizens supports the complaint.
    const supporters = citizens
      .filter((candidate) => !candidate._id.equals(citizen._id))
      .filter(() => rand() > 0.45);

    const issue = new Issue({
      complaintId: `CIV-${String(createdAt.getFullYear()).slice(2)}${String(
        createdAt.getMonth() + 1,
      ).padStart(2, '0')}${String(createdAt.getDate()).padStart(2, '0')}-${String(
        1000 + created,
      ).slice(-4)}`,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      photos: spec.photoPrompt ? [photo(spec.photoPrompt)] : [],
      location: {
        address: spec.address,
        area: spec.area,
        city: spec.city,
        pincode: spec.pincode,
        lat: spec.lat,
        lng: spec.lng,
      },
      reportedBy: citizen._id,
      status: spec.status,
      priority,
      priorityWeight: priorityWeightOf(priority),
      assignedDepartment: CATEGORY_DEPARTMENT[spec.category] || '',
      assignedTo:
        spec.status === ISSUE_STATUS.SUBMITTED
          ? null
          : officers.find((officer) => officer.department === CATEGORY_DEPARTMENT[spec.category])?._id ??
            admin._id,
      upvotes: supporters.map((supporter) => supporter._id),
      upvoteCount: supporters.length,
      statusHistory: history,
      rejectionReason: spec.rejectionReason || '',
      resolution:
        spec.status === ISSUE_STATUS.RESOLVED
          ? {
              note:
                'Site inspected and the reported defect rectified. Photographic proof attached to the work order.',
              proofPhotos: [
                photo(
                  `repaired and restored ${spec.category.replace('_', ' ')} site in an Indian city, after civic repair work`,
                  'landscape_4_3',
                ),
              ],
              resolvedBy: admin._id,
              resolvedByName: admin.name,
              resolvedAt: timeline.resolvedAt,
            }
          : undefined,
      ...timeline,
    });

    // Persist with explicit timestamps so the demo chart has history.
    issue.createdAt = createdAt;
    issue.updatedAt = timeline.lastActivityAt;
    await issue.save({ timestamps: false });

    seededIssues.push(issue);
    created += 1;
  }

  /* --- Notifications ----------------------------------------------------- */
  await Notification.deleteMany({});
  const notificationDocs = [];
  const primary = citizens[0];

  for (const issue of seededIssues.slice(0, 10)) {
    notificationDocs.push({
      recipient: issue.reportedBy,
      title: 'Complaint submitted',
      message: `We received "${issue.title}". Your reference number is ${issue.complaintId}.`,
      type: 'submission',
      issue: issue._id,
      issueComplaintId: issue.complaintId,
      issueTitle: issue.title,
      createdAt: issue.createdAt,
      read: true,
      readAt: new Date(issue.createdAt.getTime() + 3600000),
    });

    const latest = issue.statusHistory[issue.statusHistory.length - 1];
    if (latest && latest.status !== ISSUE_STATUS.SUBMITTED) {
      notificationDocs.push({
        recipient: issue.reportedBy,
        title: `Complaint ${latest.status.replace('_', ' ')}`,
        message: `Complaint ${issue.complaintId} is now "${latest.status.replace('_', ' ')}". ${latest.note}`,
        type: latest.status,
        issue: issue._id,
        issueComplaintId: issue.complaintId,
        issueTitle: issue.title,
        createdAt: latest.changedAt,
        read: false,
      });
    }
  }

  notificationDocs.push({
    recipient: primary._id,
    title: 'Welcome to CivicFix',
    message:
      'Your citizen account is ready. Report your first civic issue and track it to resolution.',
    type: 'system',
    createdAt: hoursAgo(60 * 24),
    read: true,
    readAt: hoursAgo(60 * 24),
  });

  await Notification.insertMany(notificationDocs);

  /* --- Summary ----------------------------------------------------------- */
  const [userCount, issueCount, notificationCount] = await Promise.all([
    User.countDocuments(),
    Issue.countDocuments(),
    Notification.countDocuments(),
  ]);

  // eslint-disable-next-line no-console
  console.log(`
  ────────────────────────────────────────────────────────────
   CivicFix seed complete
  ────────────────────────────────────────────────────────────
   Users ................ ${userCount}
   Complaints ........... ${issueCount} (${created} created this run)
   Notifications ........ ${notificationCount}
  ────────────────────────────────────────────────────────────
   DEMO CREDENTIALS  (password for every account: ${password})
  ────────────────────────────────────────────────────────────
   Administrator   ${ADMIN.email}
   Ward officer    ${DEPARTMENT_OFFICERS[0].email}
   Ward officer    ${DEPARTMENT_OFFICERS[1].email}
   Citizen         ${CITIZENS[0].email}
   Citizen         ${CITIZENS[1].email}
   Citizen         ${CITIZENS[2].email}
   Citizen         ${CITIZENS[3].email}
  ────────────────────────────────────────────────────────────
   Development-only accounts. Change every credential before
   deploying this application anywhere public.
  ────────────────────────────────────────────────────────────
`);
}

const fresh = process.argv.includes('--fresh');

connectDatabase()
  .then(async () => {
    await seed({ fresh });
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Failed:', error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  });

export { seed };
export default seed;
