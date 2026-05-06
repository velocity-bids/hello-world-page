/**
 * Bulk Auction Creator
 *
 * Reads folders from the `cars/` directory, parses vehicle metadata from folder names,
 * uploads images to UploadCare, and inserts vehicle listings into Supabase.
 *
 * Folder name format: {year}_{make}_{model}_{mileage}km_{duration}d_{reservePrice}eur
 * Example: 2019_BMW_M3_50000km_7d_15000eur
 *
 * Required .env.local keys:
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   UPLOADCARE_PUBLIC_KEY
 *   BULK_SELLER_ID  (your user UUID from Supabase Auth)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UPLOADCARE_KEY = process.env.UPLOADCARE_PUBLIC_KEY;
const SELLER_ID = process.env.BULK_SELLER_ID;

const CARS_DIR = join(process.cwd(), "cars");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// ── Validation ────────────────────────────────────────────────────────────────

const missing = [];
if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
if (!UPLOADCARE_KEY) missing.push("UPLOADCARE_PUBLIC_KEY");
if (!SELLER_ID) missing.push("BULK_SELLER_ID");

if (missing.length) {
  console.error(`\n❌ Missing .env.local keys:\n${missing.map((k) => `   • ${k}`).join("\n")}\n`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ── Folder parser ─────────────────────────────────────────────────────────────

function parseFolderName(name) {
  // Expected: 2019_BMW_M3_50000km_7d_15000eur
  const match = name.match(/^(\d{4})_(.+?)_(\d+)km_(\d+)d_(\d+)eur$/i);
  if (!match) return null;

  const [, yearStr, makeModel, mileageStr, daysStr, reserveStr] = match;

  // Split makeModel on first underscore to separate make from model
  const underscoreIdx = makeModel.indexOf("_");
  const make = underscoreIdx === -1 ? makeModel : makeModel.slice(0, underscoreIdx);
  const model = underscoreIdx === -1 ? makeModel : makeModel.slice(underscoreIdx + 1).replace(/_/g, " ");

  const year = parseInt(yearStr);
  const mileage = parseInt(mileageStr);
  const days = parseInt(daysStr);
  const reservePrice = parseInt(reserveStr);

  const auctionEndTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  return { year, make, model, mileage, days, reservePrice, auctionEndTime };
}

// ── Description generator ─────────────────────────────────────────────────────

function generateDescription({ year, make, model, mileage, reservePrice }) {
  const mileageFormatted = mileage.toLocaleString("en-GB");
  const reserve = reservePrice > 0
    ? `Reserve set at €${reservePrice.toLocaleString("en-GB")}.`
    : "No reserve — sold to the highest bidder.";

  return (
    `Presenting this ${year} ${make} ${model}, a well-maintained example with just ${mileageFormatted} km on the clock. ` +
    `This is a rare opportunity to acquire a vehicle of this calibre through a transparent, competitive auction. ` +
    `Full service history available upon request. Viewings welcome prior to auction end. ` +
    reserve
  );
}

// ── UploadCare uploader ───────────────────────────────────────────────────────

async function uploadToUploadCare(filePath) {
  const filename = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const blob = new Blob([fileBuffer]);

  const form = new FormData();
  form.append("UPLOADCARE_PUB_KEY", UPLOADCARE_KEY);
  form.append("UPLOADCARE_STORE", "1");
  form.append("file", blob, filename);

  const res = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UploadCare upload failed for ${filename}: ${text}`);
  }

  const json = await res.json();
  console.log(`   ⚠️  File data: \n`, json);

  const uuid = json.file;
  return `https://5vyuc8x9nq.ucarecd.net/${uuid}/`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const folders = readdirSync(CARS_DIR).filter((name) => {
    const full = join(CARS_DIR, name);
    return statSync(full).isDirectory() && !name.startsWith(".");
  });

  console.log(`\n🚗 Found ${folders.length} car folder(s)\n`);

  const results = { success: [], failed: [] };

  for (const folder of folders) {
    console.log(`── ${folder}`);
    const folderPath = join(CARS_DIR, folder);

    const parsed = parseFolderName(folder);
    if (!parsed) {
      console.log(`   ⚠️  Skipped — couldn't parse folder name\n`);
      results.failed.push({ folder, reason: "Invalid folder name format" });
      continue;
    }

    const imageFiles = readdirSync(folderPath)
      .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()) && !f.startsWith("."))
      .sort()
      .map((f) => join(folderPath, f));

    if (imageFiles.length === 0) {
      console.log(`   ⚠️  Skipped — no images found\n`);
      results.failed.push({ folder, reason: "No images found" });
      continue;
    }

    console.log(`   📸 Uploading ${imageFiles.length} image(s)...`);

    let imageUrls;
    try {
      imageUrls = await Promise.all(imageFiles.map(uploadToUploadCare));
      console.log(`   ✅ Uploaded ${imageUrls.length} image(s)`);
    } catch (err) {
      console.log(`   ❌ Upload failed: ${err.message}\n`);
      results.failed.push({ folder, reason: err.message });
      continue;
    }

    const description = generateDescription(parsed);

    const vehicleData = {
      seller_id: SELLER_ID,
      make: parsed.make,
      model: parsed.model,
      year: parsed.year,
      mileage: parsed.mileage,
      reserve_price: parsed.reservePrice > 0 ? parsed.reservePrice : null,
      starting_bid: 0,
      auction_end_time: parsed.auctionEndTime,
      images: imageUrls,
      image_url: imageUrls[0],
      description,
      status: "active",
      approval_status: "approved",
    };

    const { error } = await supabase.from("vehicles").insert(vehicleData);

    if (error) {
      console.log(`   ❌ Supabase insert failed: ${error.message}\n`);
      results.failed.push({ folder, reason: error.message });
    } else {
      console.log(`   🏁 Created: ${parsed.year} ${parsed.make} ${parsed.model} — ends in ${parsed.days}d\n`);
      results.success.push(folder);
    }
  }

  console.log("─────────────────────────────────");
  console.log(`✅ Created: ${results.success.length}`);
  if (results.failed.length) {
    console.log(`❌ Failed:  ${results.failed.length}`);
    results.failed.forEach(({ folder, reason }) => console.log(`   • ${folder}: ${reason}`));
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
