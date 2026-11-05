const mongoose = require("mongoose");
const dns = require("dns");

// 🌐 Use Google & Cloudflare DNS to reliably resolve MongoDB Atlas SRV records on Windows
// This fixes: "querySrv ECONNREFUSED _mongodb._tcp.cluster0.kodegos.mongodb.net"
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.warn("Could not set custom DNS servers:", e.message);
}

// Direct replica set connection string fallback (bypasses SRV DNS lookup entirely)
const DIRECT_FALLBACK_URI =
  "mongodb://tatiguntavaishnavi_db_user:Vaishnavi@ac-crvx331-shard-00-00.kodegos.mongodb.net:27017,ac-crvx331-shard-00-01.kodegos.mongodb.net:27017,ac-crvx331-shard-00-02.kodegos.mongodb.net:27017/shoppingcart?ssl=true&replicaSet=atlas-di2mmu-shard-0&authSource=admin&retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected via Atlas");
  } catch (err) {
    console.warn("⚠️ SRV connection failed (" + err.message + "), retrying via Direct Replica Set...");
    try {
      await mongoose.connect(DIRECT_FALLBACK_URI);
      console.log("✅ MongoDB Connected via Direct Replica Set Fallback");
    } catch (fallbackErr) {
      console.error("❌ MongoDB connection error:", fallbackErr.message);
      if (fallbackErr.cause) console.error("Details:", fallbackErr.cause);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
