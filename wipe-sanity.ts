import { writeClient } from "./src/sanity/lib/client";

async function wipeDataset() {
  console.log("🚀 Starting fresh: Wiping all Sanity content...");
  
  const types = [
    "movie", "series", "sports", "special", "content", 
    "liveChannel", "heroCarousel", "sectionStack", 
    "verticalSettings", "adSettings"
  ];

  try {
    for (const type of types) {
      console.log(`🗑️  Deleting all documents of type: ${type}...`);
      const query = `*[_type == "${type}"]`;
      const docs = await writeClient.fetch(query);
      
      if (docs.length === 0) {
        console.log(`✅ No documents found for type: ${type}`);
        continue;
      }

      const transaction = writeClient.transaction();
      docs.forEach((doc: any) => transaction.delete(doc._id));
      await transaction.commit();
      console.log(`✅ Deleted ${docs.length} documents of type: ${type}`);
    }
    console.log("\n✨ Dataset wiped successfully! You are ready to start fresh.");
  } catch (error) {
    console.error("❌ Error wiping dataset:", error);
  }
}

wipeDataset();
