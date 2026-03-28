# Smart Credential: A Blockchain-Based Academic Verification System

## 1. Project Overview

The **Smart Credential** project is an innovative platform designed to solve the real-world problem of academic certificate forgery. In simple terms, it takes the core idea of **Blockchain technology**—a secure, unchangeable digital ledger—and applies it to student records. 

Instead of relying on fragile paper documents that can be easily tampered with, the system converts a student's academic achievements (like their name, university serial number, and CGPA) into a unique, tamper-proof digital footprint. This is achieved using advanced cryptographic hashing. Furthermore, it operates offline, meaning student data remains private and secure without being exposed to public internet networks. As an added feature, the project includes an AI-inspired Skill Assessment module to test and evaluate student competencies across various technical domains.

---

## 2. The Complete Project Workflow

The system follows a straightforward but highly secure step-by-step workflow:

### Phase 1: Issuing the Credential
1. **Data Entry:** An authorized administrator (like a teacher or university official) inputs the student's details into the system portal.
2. **Cryptographic Sealing:** The system gathers these details along with a timestamp and the "digital signature" (hash) of the *previous* student's certificate. It mixes all this data together using a mathematical algorithm (SHA-256) to create a brand-new, unique hash. 
3. **Ledger Update:** This new block of information is permanently saved into the system's ledger (acting as our local blockchain).
4. **QR Code Generation:** The system then automatically generates a QR code. This code contains the specific ID and security hash belonging to that newly created certificate.

### Phase 2: Verifying the Credential
1. **Certificate Presentation:** The student presents their certificate (equipped with the generated QR code) to a third party, such as a future employer.
2. **Scanning / Manual Entry:** The employer uses the system's Verification page to either scan the QR code via an image upload or manually type in the student's details.
3. **Authenticity Check:** The system decodes the QR block ID and hash. It then looks up the local ledger to see if a perfect match exists. If even a single character in the student's name or grades was altered, the mathematical hash would break, and the system would instantly flag the certificate as fake.

### Phase 3: Skill Assessment
1. **Domain Evaluation:** Students can interact with a built-in assessment module, answering questions across domains like Programming, DBMS, and Cybersecurity.
2. **Performance Feedback:** The system scores the answers and provides constructive feedback on the student's strengths and weaknesses depending on the technical domain.

---

## 3. Important Code Snippets Explained

Here are the critical pieces of code that make the system tick, explained in simple academic terms.

### A. The Blueprint of Security (Cryptographic Hashing)
```typescript
function calculateHash(data: any) {
  const str = `${data.name}${data.usn}${data.course}${data.cgpa}${data.result_status}${data.timestamp}${data.previous_hash}`;
  return crypto.createHash("sha256").update(str).digest("hex");
}
```
**What it does:** This function is the heart of the system's security. It takes all the student's data—including the exact time it was created and the hash of the *previous* block—and stitches them together into one long sentence. It then passes this sentence through a `sha256` hashing algorithm. 

**Why it matters:** The algorithm scrambles the sentence into a fixed-length string of random-looking characters. Since it includes the `previous_hash`, it mathematically chains the certificates together. If someone tries to secretly change a student's grade, the hash completely changes, breaking the chain to the next block and exposing the fraud.

### B. Creating the Chain (Adding to the Ledger)
```typescript
const previous_hash = ledger.length > 0 ? ledger[ledger.length - 1].current_hash : "0";
const block_id = ledger.length + 1;
const current_hash = calculateHash({ name, usn, course, cgpa: cgpaNum, result_status, timestamp, previous_hash });

const newBlock = {
  block_id, timestamp, name, usn, course, cgpa: cgpaNum, result_status, previous_hash, current_hash
};
ledger.push(newBlock);
```
**What it does:** When an admin hits "Issue", the code first looks at the digital ledger to find the very last certificate that was issued. It grabs that past hash and sets it as the `previous_hash` for the new certificate. Finally, it creates the new block and physically saves it (`ledger.push`) into our local database.

**Why it matters:** This code literally builds the "chain" in "blockchain." By relying on the previous certificate to create the new one, it ensures that removing or modifying historical records is mathematically impossible without rewriting the entire history.

### C. The Digital Check (QR Code Verification)
```typescript
const code = jsQR(imageData.data, imageData.width, imageData.height);
if (code) {
  const [id, hash] = code.data.split("|");
  const block = ledger.find(b => b.block_id === parseInt(id) && b.current_hash === hash);
  setResult({ verified: !!block, details: block || null });
}
```
**What it does:** When an employer uploads the QR code image, the `jsQR` library scans and reads it. It splits the hidden text inside the QR code into an `id` and a `hash`. The code then sifts through the secure ledger (`ledger.find`) to see if an entry exists that perfectly matches both criteria.

**Why it matters:** This provides a seamless, offline layer of trust. The employer doesn't need to contact a university to verify the certificate; they just rely on the irrefutable math of the hash cross-matched with the undeniable ledger record.
