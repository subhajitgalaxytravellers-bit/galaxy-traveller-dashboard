// src/data/blogs.js
const sampleImgs = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200",
  "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1200",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200",
];

const authors = [
  { id: oid(1), name: "Rishabh Gupta" },
  { id: oid(2), name: "Aarav Shah" },
  { id: oid(3), name: "Neha Sharma" },
];

const destinations = [
  { id: oid(101), name: "Goa" },
  { id: oid(102), name: "Jaipur" },
  { id: oid(103), name: "Manali" },
  { id: oid(104), name: "Andaman" },
];

const categories = [
  { id: oid(201), name: "Beach" },
  { id: oid(202), name: "Adventure" },
  { id: oid(203), name: "Culture" },
];

const months = [
  { id: oid(301), name: "January" },
  { id: oid(302), name: "March" },
  { id: oid(303), name: "May" },
  { id: oid(304), name: "December" },
];

// --- helpers ---
function oid(n = 1) {
  // make a fake 24-hex Mongo-like id (deterministic for demo)
  const hex = (n >>> 0).toString(16).padStart(6, "0");
  return `64a${hex}0b1c2d3e4f5a6b7c8d`; // 24 chars
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

function makeBlog(i) {
  const dest = pick(destinations);
  const title = `Exploring ${dest.name} in ${pick(months).name}`;
  return {
    id: oid(1000 + i), // full id kept in data
    slug: slugify(title),
    title,
    description:
      "A quick guide with tips, places to see, and the best time to visit. Curated by our travel experts.",
    displayImg: pick(sampleImgs),
    body: "<p>Sample body</p>",
    bodyAlt: "Alt body",
    destinations: pickN(destinations, 1 + Math.floor(Math.random() * 2)),
    experiences: [],
    tours: [],
    blogs: [],
    blog: null,
    seo: null,
    author: pick(authors),
    tagMonths: pickN(months, 1),
    categories: pickN(categories, 1 + Math.floor(Math.random() * 1)),
    createdAt: new Date(
      Date.now() - Math.random() * 20 * 86400000
    ).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const Blogs = Array.from({ length: 12 }, (_, i) => makeBlog(i + 1));
