import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import cors from "cors";

const app = express();
const PORT = 3000;
const LEDGER_FILE = path.join(process.cwd(), "ledger.json");

// Ensure ledger.json exists
if (!fs.existsSync(LEDGER_FILE)) {
  fs.writeJsonSync(LEDGER_FILE, []);
}

app.use(cors());
app.use(express.json());

// Helper to calculate hash
function calculateHash(data: any) {
  const str = `${data.name}${data.usn}${data.course}${data.cgpa}${data.result_status}${data.timestamp}${data.previous_hash}`;
  return crypto.createHash("sha256").update(str).digest("hex");
}

// 1. Issue Credential
app.post("/api/issue", async (req, res) => {
  try {
    const { name, usn, course, cgpa, baseUrl } = req.body;
    const cgpaNum = parseFloat(cgpa);
    const result_status = cgpaNum >= 5 ? "PASS" : "FAIL";
    const timestamp = new Date().toISOString();
    
    const ledger = await fs.readJson(LEDGER_FILE);
    const previous_hash = ledger.length > 0 ? ledger[ledger.length - 1].current_hash : "0";
    
    const block_id = ledger.length + 1;
    const current_hash = calculateHash({ name, usn, course, cgpa: cgpaNum, result_status, timestamp, previous_hash });
    
    const newBlock = {
      block_id,
      timestamp,
      name,
      usn,
      course,
      cgpa: cgpaNum,
      result_status,
      previous_hash,
      current_hash
    };
    
    ledger.push(newBlock);
    await fs.writeJson(LEDGER_FILE, ledger, { spaces: 2 });
    
    // Generate Mobile-Scanable QR Code linking to the certificate
    const host = baseUrl || "http://localhost:3000";
    const qrData = `${host}?view=share&id=${block_id}&hash=${current_hash}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    res.json({ success: true, block: newBlock, qrCode: qrCodeUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to issue credential" });
  }
});

// 2. Verify Credential (Manual)
app.post("/api/verify", async (req, res) => {
  try {
    const { name, usn, course, cgpa, current_hash } = req.body;
    const cgpaNum = parseFloat(cgpa);
    
    const ledger = await fs.readJson(LEDGER_FILE);
    
    // Find a block that matches all provided details
    const block = ledger.find((b: any) => 
      b.name === name && 
      b.usn === usn && 
      b.course === course && 
      Math.abs(b.cgpa - cgpaNum) < 0.001 && 
      b.current_hash === current_hash
    );
    
    if (block) {
      // Verify cryptographic integrity
      const realHash = calculateHash(block);
      if (realHash === block.current_hash) {
        return res.json({ verified: true, details: block });
      }
    }
    
    res.json({ verified: false, details: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// 2.5 Verify QR Code Cryptographically
app.post("/api/verify-qr", async (req, res) => {
  try {
    const { block_id, current_hash } = req.body;
    const ledger = await fs.readJson(LEDGER_FILE);
    
    const block = ledger.find((b: any) => b.block_id === block_id && b.current_hash === current_hash);
    
    if (block) {
      // CRITICAL: Mathematically ensure the block data hasn't been maliciously tampered in the JSON
      const realHash = calculateHash(block);
      if (realHash === block.current_hash) {
        return res.json({ verified: true, details: block });
      }
    }
    
    res.json({ verified: false, details: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// 3. Get Ledger
app.get("/api/ledger", async (req, res) => {
  try {
    const ledger = await fs.readJson(LEDGER_FILE);
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

// 4. Export to Excel
app.get("/api/export-ledger", async (req, res) => {
  try {
    const ledger = await fs.readJson(LEDGER_FILE);
    const worksheet = XLSX.utils.json_to_sheet(ledger);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    res.setHeader("Content-Disposition", "attachment; filename=ledger.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: "Failed to export ledger" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
