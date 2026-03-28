import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Database, 
  BrainCircuit, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Upload,
  ChevronRight,
  Award,
  BarChart3,
  AlertCircle,
  Moon,
  Sun,
  Share2,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsQR from "jsqr";

// --- Types ---

interface Block {
  block_id: number;
  timestamp: string;
  name: string;
  usn: string;
  course: string;
  cgpa: number;
  result_status: string;
  previous_hash: string;
  current_hash: string;
}

interface Question {
  id: number;
  domain: string;
  question: string;
  options: string[];
  correct: number;
}

// --- Constants ---

const DOMAINS = [
  "Programming",
  "Data Structures & Algorithms",
  "DBMS",
  "Web Development",
  "Cybersecurity"
];

const DOMAIN_FEEDBACK: Record<string, { strength: string; weakness: string }> = {
  "Programming": {
    strength: "Strong grasp of fundamental programming concepts, including data types and language-specific behaviors.",
    weakness: "Consider reviewing core programming fundamentals, such as primitive data types and basic operator logic."
  },
  "Data Structures & Algorithms": {
    strength: "Excellent understanding of data organization and algorithmic efficiency, particularly in trees and stacks.",
    weakness: "Focus on learning fundamental data structures (like Stacks/Queues) and their time complexities (Big O notation)."
  },
  "DBMS": {
    strength: "Solid knowledge of database management, including SQL commands and transactional integrity (ACID).",
    weakness: "Review database operations (SQL commands) and the core principles of reliable transactions (ACID properties)."
  },
  "Web Development": {
    strength: "Proficient in web technologies, demonstrating clear understanding of CSS styling and the Document Object Model (DOM).",
    weakness: "Strengthen your knowledge of web basics, specifically CSS properties and how the browser represents pages (DOM)."
  },
  "Cybersecurity": {
    strength: "Good awareness of security principles, including network protection (firewalls) and secure communication protocols (HTTPS).",
    weakness: "Learn more about basic security measures like firewalls and the importance of using secure protocols for data transfer."
  }
};

const QUESTIONS: Question[] = [
  { id: 1, domain: "Programming", question: "Which of the following is not a primitive data type in Java?", options: ["int", "boolean", "String", "char"], correct: 2 },
  { id: 2, domain: "Programming", question: "What is the output of 2 + '2' in JavaScript?", options: ["4", "22", "NaN", "Error"], correct: 1 },
  { id: 3, domain: "Data Structures & Algorithms", question: "What is the time complexity of searching in a balanced Binary Search Tree?", options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"], correct: 2 },
  { id: 4, domain: "Data Structures & Algorithms", question: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Linked List", "Tree"], correct: 1 },
  { id: 5, domain: "DBMS", question: "Which SQL command is used to remove all records from a table without deleting the table structure?", options: ["DELETE", "DROP", "TRUNCATE", "REMOVE"], correct: 2 },
  { id: 6, domain: "DBMS", question: "What does ACID stand for in database transactions?", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Consistency, Isolation, Durability", "Atomicity, Completeness, Isolation, Durability", "Atomicity, Consistency, Integration, Durability"], correct: 0 },
  { id: 7, domain: "Web Development", question: "Which CSS property is used to change the text color of an element?", options: ["font-color", "text-color", "color", "background-color"], correct: 2 },
  { id: 8, domain: "Web Development", question: "What does DOM stand for?", options: ["Data Object Model", "Document Object Model", "Display Object Model", "Document Oriented Model"], correct: 1 },
  { id: 9, domain: "Cybersecurity", question: "What is the primary purpose of a firewall?", options: ["To speed up internet", "To block unauthorized access", "To store passwords", "To scan for viruses"], correct: 1 },
  { id: 10, domain: "Cybersecurity", question: "Which protocol is considered secure for web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correct: 2 },
];

// --- Components ---

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "issue" | "verify" | "ledger" | "assessment" | "share">("home");
  const [sharedBlock, setSharedBlock] = useState<Block | null>(null);
  const [ledger, setLedger] = useState<Block[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    fetchLedger();
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const id = params.get("id");
    const hash = params.get("hash");

    if (view === "share" && id && hash) {
      handleSharedLink(parseInt(id), hash);
    }
  }, []);

  const handleSharedLink = async (id: number, hash: string) => {
    try {
      const res = await fetch("/api/ledger");
      const data: Block[] = await res.json();
      const block = data.find(b => b.block_id === id && b.current_hash === hash);
      if (block) {
        setSharedBlock(block);
        setActiveTab("share");
      }
    } catch (err) {
      console.error("Failed to verify shared link", err);
    }
  };

  useEffect(() => {
    console.log("Dark mode toggled:", isDarkMode);
    if (isDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setToast({ message: "Link copied to clipboard!", type: "success" });
        return true;
      }
      throw new Error("Clipboard API unavailable");
    } catch (err) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          setToast({ message: "Link copied to clipboard!", type: "success" });
        } else {
          setToast({ message: "Failed to copy link", type: "error" });
        }
        return successful;
      } catch (fallbackErr) {
        setToast({ message: "Failed to copy link", type: "error" });
        return false;
      }
    }
  };

  const createParticles = (x: number, y: number) => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '10000';
    document.body.appendChild(container);

    const particleCount = 60;
    const colors = isDarkMode ? ['#818cf8', '#6366f1', '#4f46e5', '#c7d2fe'] : ['#1e293b', '#334155', '#475569', '#94a3b8'];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 6 + 2;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 12 + 4;
      const destinationX = Math.cos(angle) * velocity * 20;
      const destinationY = Math.sin(angle) * velocity * 20;
      const rotation = Math.random() * 720;
      const delay = Math.random() * 50;

      particle.style.position = 'absolute';
      particle.style.top = `${y}px`;
      particle.style.left = `${x}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '1px';
      particle.style.boxShadow = `0 0 10px ${particle.style.backgroundColor}`;
      particle.style.opacity = '0';
      
      container.appendChild(particle);

      particle.animate([
        { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.5) rotate(0deg)', opacity: 1, offset: 0.1 },
        { transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) scale(0) rotate(${rotation}deg)`, opacity: 0 }
      ], {
        duration: 800 + Math.random() * 600,
        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        delay: delay
      }).onfinish = () => {
        particle.remove();
        if (container.childNodes.length === 0) {
          container.remove();
        }
      };
    }
  };

  const toggleTheme = (event: React.MouseEvent) => {
    const x = event.clientX;
    const y = event.clientY;
    
    createParticles(x, y);

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // @ts-ignore
    if (!document.startViewTransition) {
      setIsDarkMode(!isDarkMode);
      return;
    }

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setIsDarkMode(!isDarkMode);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-slate-200 font-sans">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 z-50 transition-colors duration-500">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-bold text-lg leading-tight tracking-tight dark:text-white">
            Smart<br /><span className="text-indigo-600">Credential</span>
          </h1>
        </div>

        <div className="flex flex-col gap-1">
          <NavItem active={activeTab === "home"} onClick={() => setActiveTab("home")} icon={<BarChart3 size={20} />} label="Dashboard" isDarkMode={isDarkMode} />
          <NavItem active={activeTab === "issue"} onClick={() => setActiveTab("issue")} icon={<PlusCircle size={20} />} label="Issue Credential" isDarkMode={isDarkMode} />
          <NavItem active={activeTab === "verify"} onClick={() => setActiveTab("verify")} icon={<Search size={20} />} label="Verify" isDarkMode={isDarkMode} />
          <NavItem active={activeTab === "ledger"} onClick={() => setActiveTab("ledger")} icon={<Database size={20} />} label="Ledger" isDarkMode={isDarkMode} />
          <NavItem active={activeTab === "assessment"} onClick={() => setActiveTab("assessment")} icon={<BrainCircuit size={20} />} label="Skill Assessment" isDarkMode={isDarkMode} />
        </div>

        <div className="mt-auto space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-100 dark:border-slate-800"
          >
            {isDarkMode ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-indigo-600" />}
            <span className="font-medium">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Ledger Online
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-64 p-10 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeView key="home" onNavigate={setActiveTab} ledgerCount={ledger.length} isDarkMode={isDarkMode} />}
          {activeTab === "issue" && <IssueView key="issue" onIssued={fetchLedger} isDarkMode={isDarkMode} onCopy={copyToClipboard} />}
          {activeTab === "verify" && <VerifyView key="verify" ledger={ledger} isDarkMode={isDarkMode} />}
          {activeTab === "ledger" && <LedgerView key="ledger" ledger={ledger} isDarkMode={isDarkMode} onCopy={copyToClipboard} />}
          {activeTab === "assessment" && <AssessmentView key="assessment" isDarkMode={isDarkMode} />}
          {activeTab === "share" && sharedBlock && <ShareView block={sharedBlock} isDarkMode={isDarkMode} onBack={() => setActiveTab("home")} onCopy={copyToClipboard} />}
        </AnimatePresence>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border ${
              toast.type === "success" 
                ? "bg-emerald-600 text-white border-emerald-500" 
                : "bg-rose-600 text-white border-rose-500"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, isDarkMode }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; isDarkMode: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm shadow-indigo-100 dark:shadow-none" 
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <span className={`${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// --- Views ---

function HomeView({ onNavigate, ledgerCount, isDarkMode }: { onNavigate: (tab: any) => void; ledgerCount: number; isDarkMode: boolean; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2 dark:text-white">Welcome back, Admin</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage and verify academic credentials with cryptographic security.</p>
      </header>

      <div className="grid grid-cols-3 gap-6">
        <StatCard 
          icon={<Database className="text-indigo-600 dark:text-indigo-400" />} 
          label="Total Blocks" 
          value={ledgerCount.toString()} 
          color="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />} 
          label="Verified Status" 
          value="Healthy" 
          color="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard 
          icon={<ShieldCheck className="text-amber-600 dark:text-amber-400" />} 
          label="Security Level" 
          value="SHA-256" 
          color="bg-amber-50 dark:bg-amber-900/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-xl font-bold mb-4 dark:text-white">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <ActionButton 
              onClick={() => onNavigate("issue")} 
              icon={<PlusCircle size={20} />} 
              label="Issue New Certificate" 
              desc="Create a new cryptographic credential"
            />
            <ActionButton 
              onClick={() => onNavigate("verify")} 
              icon={<Search size={20} />} 
              label="Verify Certificate" 
              desc="Check authenticity via hash or QR"
            />
          </div>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-700 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Skill Assessment</h3>
            <p className="text-indigo-100 mb-6 text-sm">Evaluate student skills across multiple domains using our AI-driven assessment module.</p>
            <button 
              onClick={() => onNavigate("assessment")}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              Start Assessment <ChevronRight size={16} />
            </button>
          </div>
          <BrainCircuit className="absolute -right-8 -bottom-8 text-indigo-500 opacity-20" size={200} />
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ onClick, icon, label, desc }: { onClick: () => void; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all text-left group"
    >
      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-bold text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </button>
  );
}

function IssueView({ onIssued, isDarkMode, onCopy }: { onIssued: () => void; isDarkMode: boolean; onCopy: (text: string) => void; key?: string }) {
  const [formData, setFormData] = useState({ name: "", usn: "", course: "", cgpa: "" });
  const [issuedBlock, setIssuedBlock] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = window.location.href.split('?')[0].replace(/\/$/, "");
      const res = await fetch("/api/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, baseUrl })
      });
      const data = await res.json();
      if (data.success) {
        setIssuedBlock(data.block);
        setQrCode(data.qrCode);
        onIssued();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {issuedBlock ? (
        <motion.div 
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Credential Issued Successfully!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">The certificate has been cryptographically signed and added to the ledger.</p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-left mb-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student Name</p>
              <p className="font-bold dark:text-white">{issuedBlock.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">USN</p>
              <p className="font-bold dark:text-white">{issuedBlock.usn}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course</p>
              <p className="font-bold dark:text-white">{issuedBlock.course}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CGPA / Status</p>
              <p className="font-bold dark:text-white">{issuedBlock.cgpa} - <span className={issuedBlock.result_status === "PASS" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{issuedBlock.result_status}</span></p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Hash</p>
              <p className="text-[10px] font-mono break-all text-slate-600 dark:text-slate-400">{issuedBlock.current_hash}</p>
            </div>
          </div>

          {qrCode && (
            <div className="mb-8">
              <p className="text-sm font-bold mb-4 dark:text-white">Verification QR Code</p>
              <div className="bg-white p-4 border border-slate-200 dark:border-slate-800 rounded-2xl inline-flex items-center justify-center shadow-sm relative group">
                <img src={qrCode} alt="Verification QR" className="w-40 h-40 transition-opacity duration-300 group-hover:opacity-30" />
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = qrCode;
                    link.download = `credential-qr-${issuedBlock.usn}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute m-auto w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg cursor-pointer hover:bg-indigo-700"
                  title="Download QR Code"
                >
                  <Download size={20} />
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">ID: {issuedBlock.block_id} | Hash: {issuedBlock.current_hash.substring(0, 8)}...</p>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => {
                const baseUrl = window.location.href.split('?')[0];
                const shareUrl = `${baseUrl}?view=share&id=${issuedBlock.block_id}&hash=${issuedBlock.current_hash}`;
                onCopy(shareUrl);
              }}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 size={20} /> Share
            </button>
            <button 
              onClick={() => { setIssuedBlock(null); setFormData({ name: "", usn: "", course: "", cgpa: "" }); }}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Issue Another
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="form"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="max-w-xl mx-auto"
        >
          <header className="mb-8">
            <h2 className="text-2xl font-bold mb-2 dark:text-white">Issue New Credential</h2>
            <p className="text-slate-500 dark:text-slate-400">Fill in the student details to generate a cryptographic certificate.</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Student Name</label>
              <input 
                required
                type="text"
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">USN (University Serial Number)</label>
              <input 
                required
                type="text"
                placeholder="e.g. 1RV20CS001"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.usn}
                onChange={e => setFormData({ ...formData, usn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Course Name</label>
              <input 
                required
                type="text"
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.course}
                onChange={e => setFormData({ ...formData, course: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">CGPA (0 - 10)</label>
              <input 
                required
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.5"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                value={formData.cgpa}
                onChange={e => setFormData({ ...formData, cgpa: e.target.value })}
              />
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Processing..." : <><PlusCircle size={20} /> Generate Certificate</>}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VerifyView({ ledger, isDarkMode }: { ledger: Block[]; key?: string; isDarkMode: boolean }) {
  const [method, setMethod] = useState<"manual" | "qr">("manual");
  const [manualData, setManualData] = useState({ name: "", usn: "", course: "", cgpa: "", current_hash: "" });
  const [result, setResult] = useState<{ verified: boolean; details: Block | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualData)
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          const qrText = code.data;
          let id, hash;
          
          if (qrText.includes("?view=share") || qrText.includes("id=")) {
            try {
              const urlParamStr = qrText.substring(qrText.indexOf("?"));
              const params = new URLSearchParams(urlParamStr);
              id = params.get("id");
              hash = params.get("hash");
            } catch (e) {
              // fallback
            }
          } else {
            [id, hash] = qrText.split("|");
          }

          if (!id || !hash) {
            alert("Invalid Certificate QR Code.");
            return;
          }

          setLoading(true);
          fetch("/api/verify-qr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ block_id: parseInt(id), current_hash: hash })
          })
          .then(res => res.json())
          .then(data => setResult(data))
          .catch(err => {
            console.error(err);
            setResult({ verified: false, details: null });
          })
          .finally(() => setLoading(false));
        } else {
          alert("Could not detect QR code. Please try a clearer image.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-8">
        <h2 className="text-2xl font-bold mb-2 dark:text-white">Verify Credential</h2>
        <p className="text-slate-500 dark:text-slate-400">Check the authenticity of a certificate using manual entry or QR scanning.</p>
      </header>

      <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button 
          onClick={() => { setMethod("manual"); setResult(null); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${method === "manual" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          Manual Entry
        </button>
        <button 
          onClick={() => { setMethod("qr"); setResult(null); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${method === "qr" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          QR Upload
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {method === "manual" ? (
          <form onSubmit={handleManualVerify} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Student Name</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={manualData.name} onChange={e => setManualData({ ...manualData, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">USN</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={manualData.usn} onChange={e => setManualData({ ...manualData, usn: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Course</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={manualData.course} onChange={e => setManualData({ ...manualData, course: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">CGPA</label>
                <input required type="number" step="0.01" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={manualData.cgpa} onChange={e => setManualData({ ...manualData, cgpa: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Current Hash</label>
                <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={manualData.current_hash} onChange={e => setManualData({ ...manualData, current_hash: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Verify Details
            </button>
          </form>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-2">
              <Upload size={32} />
            </div>
            <div>
              <p className="font-bold text-lg dark:text-white">Upload Certificate QR</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Select the QR code image generated during issuance.</p>
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-2 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              Select Image
            </button>
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-3xl border ${result.verified ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800"}`}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.verified ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"}`}>
                {result.verified ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${result.verified ? "text-emerald-900 dark:text-emerald-100" : "text-rose-900 dark:text-rose-100"}`}>
                  {result.verified ? "Certificate Verified" : "Verification Failed"}
                </h3>
                <p className={`text-sm ${result.verified ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {result.verified ? "This credential is authentic and untampered." : "The provided details do not match the ledger or have been tampered with."}
                </p>
              </div>
            </div>

            {result.verified && result.details && (
              <div className="bg-white/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-white/40 dark:border-slate-700/40 grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student Name</p>
                  <p className="font-bold text-slate-900 dark:text-white">{result.details.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">USN</p>
                  <p className="font-bold text-slate-900 dark:text-white">{result.details.usn}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course</p>
                  <p className="font-bold text-slate-900 dark:text-white">{result.details.course}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CGPA / Result</p>
                  <p className="font-bold text-slate-900 dark:text-white">{result.details.cgpa} - {result.details.result_status}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Issuance Date</p>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{new Date(result.details.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function LedgerView({ ledger, isDarkMode, onCopy }: { ledger: Block[]; key?: string; isDarkMode: boolean; onCopy: (text: string) => void }) {
  const handleExport = () => {
    window.location.href = "/api/export-ledger";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Cryptographic Ledger</h2>
          <p className="text-slate-500 dark:text-slate-400">A transparent, immutable record of all issued credentials.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm dark:text-white"
        >
          <Download size={18} /> Export to Excel
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-bottom border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Student Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Course & CGPA</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hashes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ledger.map((block) => (
                <tr key={block.block_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-bold text-xs">
                      {block.block_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 dark:text-white">{block.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{block.usn}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{block.course}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400">{block.cgpa}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${block.result_status === "PASS" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"}`}>
                        {block.result_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={block.previous_hash}>Prev: {block.previous_hash}</p>
                      <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate font-bold" title={block.current_hash}>Curr: {block.current_hash}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(block.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(block.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        const baseUrl = window.location.href.split('?')[0];
                        const shareUrl = `${baseUrl}?view=share&id=${block.block_id}&hash=${block.current_hash}`;
                        onCopy(shareUrl);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Share Credential"
                    >
                      <Share2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <AlertCircle size={40} strokeWidth={1.5} />
                      <p className="font-medium">No records found in the ledger.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function ShareView({ block, isDarkMode, onBack, onCopy }: { block: Block; isDarkMode: boolean; onBack: () => void; onCopy: (text: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/20 rounded-full -ml-32 -mb-32 opacity-50" />
        
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 dark:shadow-none">
            <ShieldCheck size={40} />
          </div>
          
          <h2 className="text-3xl font-bold mb-2 dark:text-white">Verified Academic Credential</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-12">This certificate is cryptographically verified and immutable.</p>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 text-left mb-10 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Student Name</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{block.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">USN</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{block.usn}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Course</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{block.course}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">CGPA / Result</p>
                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{block.cgpa} - {block.result_status}</p>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Cryptographic Signature (Hash)</p>
              <p className="text-[10px] font-mono break-all text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                {block.current_hash}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Issuance Date</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{new Date(block.timestamp).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Block ID</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">#{block.block_id}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => {
                onCopy(window.location.href);
              }}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              <Copy size={20} /> Copy Shareable Link
            </button>
            <button 
              onClick={onBack}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AssessmentView({ isDarkMode, key }: { isDarkMode: boolean; key?: string }) {
  const [step, setStep] = useState<"start" | "test" | "result">("start");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [results, setResults] = useState<any>(null);

  const startTest = () => {
    setStep("test");
    setAnswers({});
  };

  const submitTest = () => {
    const domainScores: Record<string, number> = {};
    DOMAINS.forEach(d => domainScores[d] = 0);

    QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correct) {
        domainScores[q.domain] += 1;
      }
    });

    const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
    const percentage = (totalScore / QUESTIONS.length) * 100;

    let skillLevel = "Beginner";
    if (percentage >= 80) skillLevel = "Advanced";
    else if (percentage >= 50) skillLevel = "Intermediate";

    const strengths = Object.entries(domainScores)
      .filter(([_, s]) => s >= 2)
      .map(([d]) => ({ domain: d, feedback: DOMAIN_FEEDBACK[d].strength }));
    const weaknesses = Object.entries(domainScores)
      .filter(([_, s]) => s < 2)
      .map(([d]) => ({ domain: d, feedback: DOMAIN_FEEDBACK[d].weakness }));

    let role = "Junior Developer";
    if (domainScores["Programming"] >= 1 && domainScores["Data Structures & Algorithms"] >= 1) role = "Software Developer";
    else if (domainScores["DBMS"] >= 1 && domainScores["Web Development"] >= 1) role = "Backend Developer";
    else if (domainScores["Web Development"] >= 2) role = "Frontend Developer";
    else if (domainScores["Cybersecurity"] >= 2) role = "Security Analyst";

    setResults({
      skillLevel,
      domainScores,
      percentage,
      strengths,
      weaknesses,
      role
    });
    setStep("result");
  };

  if (step === "start") {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center"
      >
        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <BrainCircuit size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-4 dark:text-white">AI Skill Assessment</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10">Evaluate your technical proficiency across 5 core domains. Get a detailed skill profile and career role suggestions.</p>
        
        <div className="grid grid-cols-2 gap-4 text-left mb-10">
          {DOMAINS.map(d => (
            <div key={d} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-2 h-2 bg-indigo-500 rounded-full" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{d}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={startTest}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          Start Assessment Now
        </button>
      </motion.div>
    );
  }

  if (step === "test") {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Assessment in Progress</h2>
            <p className="text-slate-500 dark:text-slate-400">Answer all questions to get your profile.</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl font-bold text-sm">
            {Object.keys(answers).length} / {QUESTIONS.length} Answered
          </div>
        </header>

        <div className="space-y-6">
          {QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                  {q.domain}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Question {idx + 1}</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mb-6">{q.question}</p>
              <div className="grid grid-cols-1 gap-3">
                {q.options.map((opt, optIdx) => (
                  <button 
                    key={optIdx}
                    onClick={() => setAnswers({ ...answers, [q.id]: optIdx })}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      answers[q.id] === optIdx 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none" 
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className="font-bold mr-3 opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button 
          disabled={Object.keys(answers).length < QUESTIONS.length}
          onClick={submitTest}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          Submit Assessment
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-32 -mt-32 opacity-50" />
        
        <div className="relative z-10">
          <header className="text-center mb-12">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
              <Award size={32} />
            </div>
            <h2 className="text-3xl font-bold mb-2 dark:text-white">Assessment Results</h2>
            <p className="text-slate-500 dark:text-slate-400">Your technical skill profile is ready.</p>
          </header>

          <div className="grid grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Skill Level</p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{results.skillLevel}</p>
            </div>
            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Score</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{results.percentage}%</p>
            </div>
            <div className="text-center p-6 bg-indigo-600 dark:bg-indigo-700 rounded-3xl text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Suggested Role</p>
              <p className="text-xl font-black">{results.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
                <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400" /> Domain Performance
              </h3>
              <div className="space-y-4">
                {Object.entries(results.domainScores).map(([domain, score]: [any, any]) => (
                  <div key={domain}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{domain}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}/2</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${(score / 2) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-lg mb-4 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={20} /> Strengths
                </h3>
                <div className="space-y-3">
                  {results.strengths.length > 0 ? results.strengths.map((s: any) => (
                    <div key={s.domain} className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">{s.domain}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{s.feedback}</p>
                    </div>
                  )) : <p className="text-sm text-slate-400 dark:text-slate-500 italic">No major strengths identified yet.</p>}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-4 text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle size={20} /> Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {results.weaknesses.length > 0 ? results.weaknesses.map((w: any) => (
                    <div key={w.domain} className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800">
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1">{w.domain}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{w.feedback}</p>
                    </div>
                  )) : <p className="text-sm text-slate-400 dark:text-slate-500 italic">You have a balanced profile!</p>}
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setStep("start")}
            className="w-full mt-12 bg-slate-900 dark:bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    </motion.div>
  );
}
