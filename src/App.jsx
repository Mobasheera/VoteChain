import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownLeft, ArrowUpRight, Award, Check, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, Copy, ExternalLink, FileCheck2, Flag, LayoutDashboard,
  Menu, Plus, RefreshCw, ShieldCheck, Vote, WalletCards, X, Users, Blocks,
  ChartNoAxesColumn, CircleDot, LockKeyhole, History, Settings2, Search
} from "lucide-react";

const API = "http://127.0.0.1:3001/api";
const short = (s) => s ? `${s.slice(0, 7)}…${s.slice(-5)}` : "Not available";
const dateTime = (ms) => ms ? new Date(ms).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Timestamp unavailable";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || "Something went wrong.");
  return data;
}

function App() {
  const [page, setPage] = useState("Overview");
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState("1");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [search, setSearch] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateDescription, setCandidateDescription] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [s, h, net] = await Promise.all([api("/state"), api("/history"), api("/health")]);
      setState(s); setHistory(h.history || []); setHealth(net); setNotice(null);
      if (selectedCandidate === null && s.candidates.length) setSelectedCandidate(s.candidates[0].id);
    } catch (e) {
      setNotice({ type: "error", message: e.message });
      setHealth({ ok: false });
    } finally { setLoading(false); }
  }, [selectedCandidate]);

  useEffect(() => { refresh(); const id = setInterval(refresh, 8000); return () => clearInterval(id); }, [refresh]);

  const totalVotes = useMemo(() => (state?.candidates || []).reduce((n, c) => n + c.votes, 0), [state]);
  const maxVotes = Math.max(1, ...(state?.candidates || []).map(c => c.votes));
  const myAddress = state?.voters?.find(v => v.id === Number(selectedVoter))?.address;
  const myVote = history.find(h => h.voter?.toLowerCase() === myAddress?.toLowerCase());
  const isAdmin = Number(selectedVoter) === 0;

  async function perform(task, success) {
    setBusy(true);
    try {
      const result = await task();
      setNotice({ type: "success", message: `${success}${result?.txHash ? ` Transaction ${short(result.txHash)}` : ""}` });
      await refresh();
    } catch (e) { setNotice({ type: "error", message: e.message }); }
    finally { setBusy(false); }
  }

  async function addCandidate(e) {
    e.preventDefault();
    if (!candidateName.trim()) return;
    await perform(() => api("/admin/candidate", { method: "POST", body: JSON.stringify({ name: candidateName, description: candidateDescription }) }), "Candidate added.");
    setCandidateName(""); setCandidateDescription("");
  }

  const nav = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Cast a vote", icon: Vote },
    { label: "Candidates", icon: Users },
    { label: "Results", icon: ChartNoAxesColumn },
    { label: "Transactions", icon: History }
  ];

  if (loading && !state) return <div className="boot-screen"><div className="brand-mark">V</div><h1>VoteChain</h1><p>Connecting to your local blockchain…</p><div className="loading-line" /></div>;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">V</div>
          <div><strong>VoteChain</strong><span>LOCAL ELECTION PORTAL</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => { setPage(label); setMobileNav(false); }}>
              <Icon size={18} strokeWidth={1.8}/><span>{label}</span>{label === "Transactions" && history.length > 0 && <small>{history.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-card">
            <div className="network-heading"><span className={`status-dot ${health?.ok ? "online" : ""}`} /> Network status</div>
            <strong>{health?.ok ? "Local network online" : "Network unavailable"}</strong>
            <div className="network-meta"><span>Chain ID</span><b>{health?.chainId || "----"}</b></div>
            <div className="network-meta"><span>Latest block</span><b>{health?.blockNumber ?? "----"}</b></div>
          </div>
          <div className="profile-row">
            <div className="avatar avatar-admin">VC</div>
            <div className="profile-copy"><strong>Class Election</strong><span>Demo environment</span></div>
            <CircleHelp size={17} className="muted-icon"/>
          </div>
          <div className="sidebar-footnote"><ShieldCheck size={13}/> Built for learning, not real elections</div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="local-pill"><span className="status-dot online"/> LOCAL DEMO</div>
            <button className="icon-button refresh-button" onClick={refresh} title="Refresh data" aria-label="Refresh data"><RefreshCw size={17}/></button>
          </div>
        </header>

        <div className="content-wrap">
          {notice && <div className={`notice ${notice.type}`}><span>{notice.type === "success" ? <CheckCircle2 size={17}/> : <CircleHelp size={17}/>}</span><div>{notice.message}</div><button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={16}/></button></div>}
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line"/> STUDENT COUNCIL · 2026</div>
              <h1>{page === "Overview" ? "Election overview" : page}</h1>
              <p>{page === "Overview" ? "A clear view of the election, from first vote to final count." : page === "Cast a vote" ? "Make your choice. Every eligible account gets one vote." : page === "Candidates" ? "Meet the candidates and manage the ballot." : page === "Results" ? "A transparent view of the current count." : "Every vote leaves a trace on the local chain."}</p>
            </div>
            <div className="heading-status"><span className={`status-dot ${state?.open ? "online" : ""}`}/>{state?.finalized ? "Election closed" : state?.open ? "Voting is live" : "Setup phase"}</div>
          </div>

          {page === "Overview" && <Overview state={state} totalVotes={totalVotes} maxVotes={maxVotes} history={history} onNavigate={setPage} />}
          {page === "Cast a vote" && <VotePage state={state} selectedVoter={selectedVoter} setSelectedVoter={setSelectedVoter} selectedCandidate={selectedCandidate} setSelectedCandidate={setSelectedCandidate} myVote={myVote} busy={busy} perform={perform} refresh={refresh} />}
          {page === "Candidates" && <CandidatesPage state={state} candidateName={candidateName} setCandidateName={setCandidateName} candidateDescription={candidateDescription} setCandidateDescription={setCandidateDescription} addCandidate={addCandidate} busy={busy} />}
          {page === "Results" && <ResultsPage state={state} totalVotes={totalVotes} maxVotes={maxVotes} history={history} />}
          {page === "Transactions" && <TransactionsPage history={history} state={state} search={search} setSearch={setSearch} />}
          <footer className="footer"><span>VoteChain <span className="footer-sep">·</span> Blockchain mini project</span><span><span className="status-dot online"/> Running locally <span className="footer-sep">·</span> <button onClick={() => setPage("Transactions")}>View activity <ArrowUpRight size={13}/></button></span></footer>
        </div>
      </main>
    </div>
  );
}

function Overview({ state, totalVotes, maxVotes, history, onNavigate }) {
  const leading = [...(state?.candidates || [])].sort((a, b) => b.votes - a.votes)[0];
  return <>
    <section className="hero-panel">
      <div className="hero-copy">
        <div className="hero-tag"><span className="hero-tag-dot"/> ELECTION IN FOCUS</div>
        <h2>{state?.title || "Computer Engineering Class Election"}</h2>
        <p>A small, transparent election powered by a local Ethereum-compatible blockchain. Every accepted vote is recorded as a transaction.</p>
        <div className="hero-actions"><button className="button button-light" onClick={() => onNavigate("Cast a vote")}>Go to ballot <ArrowUpRight size={16}/></button><button className="text-button hero-text-button" onClick={() => onNavigate("Transactions")}>Explore transactions <ArrowUpRight size={15}/></button></div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="art-ring ring-one"/><div className="art-ring ring-two"/><div className="art-ring ring-three"/>
        <div className="art-center"><Blocks size={34}/><span>ON CHAIN</span></div>
        <div className="art-chip chip-one"><Check size={14}/> Verified</div>
        <div className="art-chip chip-two"><span className="status-dot online"/> Block synced</div>
      </div>
      <div className="hero-bottom"><span><LockKeyhole size={14}/> Local development network</span><span><ShieldCheck size={14}/> Contract-enforced rules</span><span><Activity size={14}/> Live state updates</span></div>
    </section>

    <section className="stats-grid">
      <StatCard icon={Users} label="Candidates" value={state?.candidates?.length ?? 0} note="On the ballot" tint="sage"/>
      <StatCard icon={Vote} label="Votes recorded" value={totalVotes} note="Confirmed transactions" tint="sand"/>
      <StatCard icon={WalletCards} label="Demo voters" value={state?.voters?.length ?? 0} note="Eligible local accounts" tint="blue"/>
      <StatCard icon={Blocks} label="Latest block" value={state?.blockNumber ?? "—"} note="Local chain height" tint="lavender"/>
    </section>

    <div className="section-grid">
      <section className="panel candidate-panel">
        <div className="panel-heading"><div><span className="section-kicker">THE BALLOT</span><h3>Meet the candidates</h3></div><button className="text-button" onClick={() => onNavigate("Candidates")}>All candidates <ArrowUpRight size={15}/></button></div>
        <div className="candidate-list">
          {(state?.candidates || []).slice(0, 3).map((c, i) => <CandidateRow key={c.id} candidate={c} index={i} />)}
          {!state?.candidates?.length && <EmptyState title="No candidates yet" detail="Add candidates to prepare the ballot."/>}
        </div>
        <div className="panel-bottom-note"><ShieldCheck size={15}/> Candidate records are managed by the election administrator.</div>
      </section>
      <section className="panel activity-panel">
        <div className="panel-heading"><div><span className="section-kicker">ON-CHAIN ACTIVITY</span><h3>Recent transactions</h3></div><button className="icon-button subtle-button" onClick={() => onNavigate("Transactions")} aria-label="View all transactions"><ArrowUpRight size={17}/></button></div>
        {history.length ? <div className="activity-list">{history.slice(0, 4).map((h) => {
          const candidate = state?.candidates?.find(c => c.id === h.candidateId);
          return <div className="activity-row" key={h.txHash}><div className="activity-icon"><ArrowUpRight size={15}/></div><div className="activity-copy"><strong>Vote cast</strong><span>{short(h.voter)} voted for {candidate?.name || `Candidate ${h.candidateId + 1}`}</span></div><div className="activity-time">{h.blockNumber ? `#${h.blockNumber}` : "Pending"}</div></div>;
        })}</div> : <EmptyState title="Quiet for now" detail="Confirmed vote transactions will appear here."/>}
        <button className="panel-link" onClick={() => onNavigate("Transactions")}>View transaction history <ArrowUpRight size={15}/></button>
      </section>
    </div>
    <section className="bottom-grid">
      <div className="panel process-panel"><div className="panel-heading"><div><span className="section-kicker">HOW IT WORKS</span><h3>From choice to chain</h3></div></div><div className="process-steps"><ProcessStep number="01" title="Choose" text="An eligible demo account selects a candidate."/><div className="step-line"/><ProcessStep number="02" title="Validate" text="The Solidity contract checks voting rules."/><div className="step-line"/><ProcessStep number="03" title="Record" text="The local network confirms the transaction."/></div></div>
      <div className="panel election-status-panel"><div className="panel-heading"><div><span className="section-kicker">ELECTION STATUS</span><h3>Current snapshot</h3></div><Flag size={19} className="muted-icon"/></div><div className="status-summary"><span className={`status-large ${state?.open ? "live" : ""}`}>{state?.finalized ? "Closed" : state?.open ? "Voting live" : "Setup"}</span><span className="status-description">{state?.finalized ? "Final results are available." : state?.open ? "Eligible voters can cast one vote." : "Add candidates and start the election."}</span></div><div className="status-line"><span>Total votes</span><strong>{totalVotes}</strong></div><div className="status-line"><span>Leading candidate</span><strong>{leading?.name || "Not decided"}</strong></div><button className="button button-outline full-button" onClick={() => onNavigate("Results")}>View election results <ArrowUpRight size={15}/></button></div>
    </section>
  </>;
}

function StatCard({ icon: Icon, label, value, note, tint }) {
  return <div className="stat-card"><div className={`stat-icon ${tint}`}><Icon size={19} strokeWidth={1.8}/></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div>;
}
function CandidateRow({ candidate, index }) {
  const initials = candidate.name.split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase();
  return <div className="candidate-row"><div className={`candidate-avatar avatar-${index % 3}`}>{initials}</div><div className="candidate-info"><strong>{candidate.name}</strong><span>{candidate.description || "Candidate for class representative"}</span></div><div className="candidate-votes"><strong>{candidate.votes}</strong><span>{candidate.votes === 1 ? "vote" : "votes"}</span></div></div>;
}
function ProcessStep({ number, title, text }) { return <div className="process-step"><span className="step-number">{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }
function EmptyState({ title, detail }) { return <div className="empty-state"><div className="empty-icon"><Activity size={19}/></div><strong>{title}</strong><span>{detail}</span></div>; }

function VotePage({ state, selectedVoter, setSelectedVoter, selectedCandidate, setSelectedCandidate, myVote, busy, perform, refresh }) {
  const voted = Boolean(myVote);
  const [confirm, setConfirm] = useState(false);
  return <div className="page-columns">
    <section className="panel ballot-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR BALLOT</span><h3>Who gets your vote?</h3><p className="panel-subtitle">Choose one candidate. Your selection cannot be changed after confirmation.</p></div><div className="ballot-symbol"><Vote size={22}/></div></div>
      <div className="voter-select-wrap"><label htmlFor="voter-select">Demo voter account</label><div className="select-shell"><WalletCards size={17}/><select id="voter-select" value={selectedVoter} onChange={e => { setSelectedVoter(e.target.value); setConfirm(false); }}><option value="0">Election administrator (read only)</option>{(state?.voters || []).map(v => <option key={v.id} value={v.id}>{v.label} · {short(v.address)}</option>)}</select><ChevronDown size={15}/></div><span className="field-hint">This selector simulates switching between local development accounts. It is not identity verification.</span></div>
      <div className="ballot-options">{(state?.candidates || []).map((c, i) => <button key={c.id} className={`ballot-option ${selectedCandidate === c.id ? "selected" : ""}`} onClick={() => { setSelectedCandidate(c.id); setConfirm(false); }} disabled={!state?.open || voted || selectedVoter === "0"}><div className={`candidate-avatar avatar-${i % 3}`}>{c.name.split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase()}</div><div className="ballot-candidate-info"><strong>{c.name}</strong><span>{c.description || "Candidate"}</span></div><span className="radio-indicator">{selectedCandidate === c.id && <span/>}</span></button>)}</div>
      {voted && <div className="inline-success"><CheckCircle2 size={17}/><span>This account has already voted. The contract will not accept another vote.</span></div>}
      {!state?.open && !state?.finalized && <div className="inline-info"><Clock3 size={17}/><span>Voting has not started. The administrator must open the election first.</span></div>}
      {state?.finalized && <div className="inline-info"><LockKeyhole size={17}/><span>This election is closed. No further votes can be cast.</span></div>}
      {confirm && <div className="confirm-box"><strong>Confirm your selection</strong><p>You are voting for <b>{state?.candidates?.find(c => c.id === selectedCandidate)?.name}</b> using {state?.voters?.find(v => v.id === Number(selectedVoter))?.label}. This action is permanent on this local chain.</p><div className="confirm-actions"><button className="button button-outline" onClick={() => setConfirm(false)}>Go back</button><button className="button button-primary" disabled={busy} onClick={() => perform(() => api("/vote", { method: "POST", body: JSON.stringify({ voterIndex: Number(selectedVoter), candidateId: selectedCandidate }) }), "Vote confirmed on the local blockchain.")}>{busy ? "Submitting…" : "Confirm vote"} <Check size={15}/></button></div></div>}
      {!confirm && <button className="button button-primary full-button cast-button" disabled={busy || !state?.open || voted || selectedVoter === "0" || selectedCandidate === null} onClick={() => setConfirm(true)}>Review and cast vote <ArrowUpRight size={16}/></button>}
      <p className="privacy-note"><LockKeyhole size={13}/> Demo environment only. Votes and account addresses are visible on this local blockchain.</p>
    </section>
    <aside className="side-stack">
      <div className="panel info-panel"><div className="info-panel-icon"><ShieldCheck size={21}/></div><h3>Protected by contract rules</h3><p>Each vote is checked by the smart contract, not just by the website.</p><div className="rule-row"><CheckCircle2 size={15}/><span>One vote per eligible address</span></div><div className="rule-row"><CheckCircle2 size={15}/><span>Only valid candidates accepted</span></div><div className="rule-row"><CheckCircle2 size={15}/><span>Voting must be open</span></div></div>
      <div className="panel account-panel"><span className="section-kicker">ACTIVE ACCOUNT</span><div className="account-address">{short(state?.voters?.find(v => v.id === Number(selectedVoter))?.address || state?.admin)}</div><button className="copy-address" onClick={() => navigator.clipboard?.writeText(state?.voters?.find(v => v.id === Number(selectedVoter))?.address || state?.admin)}><Copy size={14}/> Copy address</button><div className="account-divider"/><div className="status-line"><span>Voting status</span><strong>{voted ? "Already voted" : state?.open ? "Eligible to vote" : "Not open"}</strong></div></div>
    </aside>
  </div>;
}

function CandidatesPage({ state, candidateName, setCandidateName, candidateDescription, setCandidateDescription, addCandidate, busy }) {
  return <><div className="page-intro-strip"><div className="intro-icon"><Users size={20}/></div><div><strong>{state?.candidates?.length || 0} candidates registered</strong><span>Candidate details are stored in the smart contract and cannot be added after voting begins.</span></div></div>
    <div className="candidate-card-grid">{(state?.candidates || []).map((c, i) => <div className="panel candidate-profile-card" key={c.id}><div className={`profile-avatar avatar-${i % 3}`}>{c.name.split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase()}</div><span className="candidate-number">CANDIDATE {String(c.id + 1).padStart(2, "0")}</span><h3>{c.name}</h3><p>{c.description || "Candidate for class representative."}</p><div className="profile-card-bottom"><span><Vote size={15}/> Votes received</span><strong>{c.votes}</strong></div><div className="profile-progress"><span style={{ width: `${totalPercent(c.votes, state?.candidates)}%` }}/></div></div>)}</div>
    {!state?.open && !state?.finalized && <section className="panel add-candidate-panel"><div className="panel-heading"><div><span className="section-kicker">ADMINISTRATION</span><h3>Add a candidate</h3><p className="panel-subtitle">Candidate additions are recorded as blockchain transactions.</p></div><div className="ballot-symbol"><Plus size={22}/></div></div><form onSubmit={addCandidate} className="candidate-form"><div className="form-field"><label htmlFor="candidate-name">Candidate name</label><input id="candidate-name" maxLength="70" placeholder="e.g. Samira Khan" value={candidateName} onChange={e => setCandidateName(e.target.value)} required/></div><div className="form-field"><label htmlFor="candidate-description">Short introduction</label><input id="candidate-description" maxLength="160" placeholder="What would they focus on?" value={candidateDescription} onChange={e => setCandidateDescription(e.target.value)}/></div><button className="button button-primary" disabled={busy}>{busy ? "Adding…" : "Add candidate"} <Plus size={15}/></button></form></section>}
    <div className="subtle-callout"><CircleHelp size={17}/><span>For this local prototype, the administrator is the first Hardhat development account. Candidate management is intentionally simple for the mini project.</span></div>
  </>;
}
function totalPercent(votes, candidates) { const total = (candidates || []).reduce((n, c) => n + c.votes, 0); return total ? Math.round(votes / total * 100) : 0; }

function ResultsPage({ state, totalVotes, maxVotes, history }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...(state?.candidates || [])].sort((a, b) => b.votes - a.votes);
  return <><section className="results-summary"><div><span className="section-kicker">ELECTION RESULTS</span><h2>{state?.finalized ? "The count is complete." : "The count so far."}</h2><p>{state?.finalized ? "Voting has ended. These are the final recorded totals." : "Results update as transactions are confirmed on the local blockchain."}</p></div><div className="results-total"><span>Total votes</span><strong>{totalVotes}</strong><span><Blocks size={13}/> Local chain record</span></div></section>
    <div className="results-layout"><section className="panel results-panel"><div className="panel-heading"><div><span className="section-kicker">LIVE TALLY</span><h3>Votes by candidate</h3></div><span className="count-badge">{sorted.length} candidates</span></div>{sorted.map((c, i) => <div className="result-row" key={c.id}><div className={`candidate-avatar avatar-${state.candidates.findIndex(x => x.id === c.id) % 3}`}>{c.name.split(/\s+/).slice(0, 2).map(x => x[0]).join("").toUpperCase()}</div><div className="result-main"><div className="result-title"><strong>{c.name}</strong>{i === 0 && totalVotes > 0 && <span className="leading-label">Leading</span>}</div><div className="result-track"><span style={{ width: `${c.votes / maxVotes * 100}%` }}/></div><span className="result-percent">{totalPercent(c.votes, state?.candidates)}% of recorded votes</span></div><div className="result-count"><strong>{c.votes}</strong><span>{c.votes === 1 ? "vote" : "votes"}</span></div></div>)}{!sorted.length && <EmptyState title="No candidates yet" detail="Candidate results will appear here."/>}<div className="results-disclaimer"><ShieldCheck size={15}/><span>Counts are read from the smart contract. The local network is a development environment, not a public election service.</span></div></section>
      <aside className="side-stack"><div className="panel winner-panel"><div className="winner-icon"><Award size={23}/></div><span className="section-kicker">{state?.finalized ? "FINAL OUTCOME" : "CURRENT LEADER"}</span>{sorted.length && totalVotes ? <><h3>{sorted[0].name}</h3><p>{state?.finalized ? "Highest vote count in the completed election." : "Currently has the highest vote count."}</p><div className="winner-score"><strong>{sorted[0].votes}</strong><span>votes</span></div></> : <><h3>Waiting for votes</h3><p>Once votes are confirmed, the leading candidate will appear here.</p></>}<div className="winner-foot"><span className={`status-dot ${state?.finalized ? "" : "online"}`}/>{state?.finalized ? "Election closed" : state?.open ? "Count in progress" : "Not started"}</div></div><div className="panel results-facts"><h3>Election facts</h3><div className="status-line"><span>Eligible demo voters</span><strong>{state?.voters?.length || 0}</strong></div><div className="status-line"><span>Confirmed transactions</span><strong>{history.length}</strong></div><div className="status-line"><span>Latest block</span><strong>{state?.blockNumber ?? "—"}</strong></div></div></aside></div>
  </>;
}

function TransactionsPage({ history, state, search, setSearch }) {
  const [copied, setCopied] = useState("");
  const filtered = history.filter(h => {
    const c = state?.candidates?.find(x => x.id === h.candidateId);
    const q = search.toLowerCase();
    return !q || h.voter.toLowerCase().includes(q) || h.txHash.toLowerCase().includes(q) || (c?.name || "").toLowerCase().includes(q) || String(h.blockNumber).includes(q);
  });
  async function copy(text) { try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(""), 1500); } catch { setCopied(""); } }
  return <><div className="page-intro-strip"><div className="intro-icon"><Blocks size={20}/></div><div><strong>{history.length} confirmed vote transactions</strong><span>Each row represents a VoteCast event emitted by the smart contract.</span></div></div>
    <section className="panel transactions-panel"><div className="table-toolbar"><div><span className="section-kicker">BLOCKCHAIN EXPLORER</span><h3>Transaction history</h3></div><div className="search-box"><Search size={15}/><input placeholder="Search address, hash, block…" value={search} onChange={e => setSearch(e.target.value)}/></div></div>
      {filtered.length ? <div className="table-scroll"><table><thead><tr><th>TRANSACTION</th><th>VOTER ACCOUNT</th><th>CANDIDATE</th><th>BLOCK</th><th>TIME</th><th>STATUS</th></tr></thead><tbody>{filtered.map(h => { const c = state?.candidates?.find(x => x.id === h.candidateId); return <tr key={h.txHash}><td><button className="hash-button" onClick={() => copy(h.txHash)} title="Copy transaction hash"><span className="hash-symbol"><ArrowUpRight size={14}/></span><span>{short(h.txHash)}</span><Copy size={12}/>{copied === h.txHash && <em>Copied</em>}</button></td><td><span className="address-cell">{short(h.voter)}</span><button className="mini-copy" onClick={() => copy(h.voter)} title="Copy voter address"><Copy size={12}/></button></td><td><span className="candidate-cell">{c?.name || `Candidate ${h.candidateId + 1}`}</span></td><td><span className="block-cell">#{h.blockNumber}</span></td><td><span className="time-cell">{dateTime(h.timestamp)}</span></td><td><span className="tx-status"><CheckCircle2 size={13}/> Confirmed</span></td></tr>; })}</tbody></table></div> : <EmptyState title={search ? "No matching transactions" : "No transactions yet"} detail={search ? "Try another address, hash, candidate or block number." : "Cast the first vote to see blockchain activity here."}/>}
      <div className="table-footer"><span>Showing {filtered.length} of {history.length} transactions</span><span><span className="status-dot online"/> Data read from local blockchain</span></div>
    </section>
    <section className="panel chain-info-panel"><div className="chain-info-icon"><Blocks size={20}/></div><div className="chain-info-copy"><strong>Connected to local Ethereum network</strong><span>Contract: {short(state?.contractAddress)} · Chain ID: {state?.chainId || "31337"} · Latest block: {state?.blockNumber ?? "—"}</span></div><button className="button button-outline" onClick={() => copy(state?.contractAddress || "")}><Copy size={14}/>{copied === state?.contractAddress ? "Copied" : "Copy contract"}</button></section>
  </>;
}

export default App;