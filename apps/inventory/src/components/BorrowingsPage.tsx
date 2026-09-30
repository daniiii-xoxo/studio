import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Search, RefreshCw, Plus, X, CheckCircle,
  AlertTriangle, Clock, ChevronLeft, ChevronRight, Package,
  User, Calendar, ArrowUpCircle, ArrowDownCircle, QrCode,
  Upload, Image as ImageIcon, ShieldAlert
} from 'lucide-react';
import { QRModal } from './QRModal';
import { ScannerModal } from './ScannerModal';
import { uploadItemPhoto } from '../utils/firebase';

interface Borrowing {
  id: string;
  itemId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowedAt: string;
  dueDate?: string;
  returnedAt?: string;
  status: string;
  checkoutNotes?: string;
  checkoutCondition?: string;
  checkoutChecklist?: any;
  quantity?: number;
  returnNotes?: string;
  returnCondition?: string;
  returnChecklist?: any;
  returnPhotos?: string[];
  item: { id: string; name: string; inventoryCode?: string; status: string; imageUrl?: string };
}

interface ChecklistTemplate {
  id: string;
  name: string;
  type: 'checkout' | 'return';
  items: { id: string; label: string; required: boolean }[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  BORROWED: { bg: '#fffbeb', color: '#d97706', label: 'Borrowed' },
  RETURNED: { bg: '#f0fdf4', color: '#16a34a', label: 'Returned' },
  OVERDUE: { bg: '#fef2f2', color: '#dc2626', label: 'Overdue' }
};

function getStatus(b: Borrowing): string {
  if (b.status === 'RETURNED') return 'RETURNED';
  if (b.dueDate && new Date(b.dueDate) < new Date()) return 'OVERDUE';
  return 'BORROWED';
}

export function BorrowingsPage() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip] = useState(0);
  const take = 10;

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutPreselect, setCheckoutPreselect] = useState<any>(null);
  const [returnModalId, setReturnModalId] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [qrItem, setQrItem] = useState<{ id: string; name: string } | null>(null);

  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String(skip),
        take: String(take),
        ...(statusFilter && { status: statusFilter })
      });
      const res = await fetch(`/api/borrowings?${params}`);
      const data = await res.json();
      setBorrowings(data.borrowings || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [skip, statusFilter]);

  useEffect(() => { fetchBorrowings(); }, [fetchBorrowings]);

  useEffect(() => {
    fetch('/api/checklist-templates')
      .then(r => r.json())
      .then(setTemplates)
      .catch(() => { });
  }, []);

  const filtered = search
    ? borrowings.filter(b =>
      b.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
      b.item.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.item.inventoryCode || '').toLowerCase().includes(search.toLowerCase())
    )
    : borrowings;

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'BORROWED', label: 'Borrowed' },
    { value: 'RETURNED', label: 'Returned' }
  ];

  const overdueCount = borrowings.filter(b => getStatus(b) === 'OVERDUE').length;
  const borrowedCount = borrowings.filter(b => b.status === 'BORROWED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1a1a2e' }}>Equipment Borrowings</h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#9ca3af' }}>Track checkout and return of equipment</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-outline"
            style={{ height: '36px', fontSize: '0.8125rem', gap: '0.35rem' }}
            onClick={() => setScanModalOpen(true)}
          >
            <QrCode size={14} /> Scan QR
          </button>
          <button
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '0.8125rem', gap: '0.35rem' }}
            onClick={() => setCheckoutModalOpen(true)}
          >
            <Plus size={14} /> New Checkout
          </button>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="stats-grid-3">
        {[
          { label: 'Total Borrowings', value: total, icon: ClipboardList, color: '#3b5bdb', bg: '#eef2ff' },
          { label: 'Currently Borrowed', value: borrowedCount, icon: ArrowDownCircle, color: '#d97706', bg: '#fffbeb' },
          { label: 'Overdue Items', value: overdueCount, icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2' }
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <card.icon size={20} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1, marginTop: '0.1rem' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Borrowings Table ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Controls */}
        <div className="action-bar">
          <div className="search-container">
            <Search size={14} color="#9ca3af" />
            <input
              type="text" placeholder="Search item or borrower…" className="search-input"
              style={{ fontSize: '0.8125rem' }}
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0 }}><X size={13} /></button>}
          </div>
          <div className="action-bar-spacer" />

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {statusOptions.map(s => (
              <button
                key={s.value}
                onClick={() => { setStatusFilter(s.value); setSkip(0); }}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem', fontWeight: 500,
                  border: '1px solid',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  borderColor: statusFilter === s.value ? '#3b5bdb' : '#e5e7eb',
                  backgroundColor: statusFilter === s.value ? '#eef2ff' : '#f9fafb',
                  color: statusFilter === s.value ? '#3b5bdb' : '#6b7280',
                  fontFamily: 'inherit'
                }}
              >{s.label}</button>
            ))}
          </div>

          <button onClick={fetchBorrowings} className="btn btn-outline" style={{ height: '34px', padding: '0 0.75rem', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <ClipboardList size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                <div style={{ fontWeight: 600, color: '#374151' }}>No borrowings found</div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Click "New Checkout" to get started.</div>
              </div>
            ) : filtered.map(b => {
              const st = getStatus(b);
              const stConfig = STATUS_COLORS[st] || STATUS_COLORS.BORROWED;
              const isOverdue = st === 'OVERDUE';
              return (
                <div key={b.id} style={{ padding: '0.875rem 1rem', backgroundColor: isOverdue ? '#fff9f9' : 'transparent' }}>
                  {/* Top row: item + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {b.item.imageUrl ? <img src={b.item.imageUrl} alt={b.item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={14} color="#3b5bdb" />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.item.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace' }}>{b.item.inventoryCode || b.itemId.slice(0, 8).toUpperCase()} · Qty: {b.quantity || 1}</div>
                      </div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: stConfig.bg, color: stConfig.color, flexShrink: 0 }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stConfig.color }} />
                      {stConfig.label}
                    </span>
                  </div>
                  {/* Borrower */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <User size={12} color="#9ca3af" />
                    <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500 }}>{b.borrowerName}</span>
                    {b.borrowerEmail && <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>· {b.borrowerEmail}</span>}
                  </div>
                  {/* Dates row */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.625rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} />
                      <span>Borrowed: {new Date(b.borrowedAt).toLocaleDateString()}</span>
                    </div>
                    {b.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue && <AlertTriangle size={11} />}
                        <span>Due: {new Date(b.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {b.status === 'BORROWED' && (
                      <button onClick={() => setReturnModalId(b.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #10b981', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <ArrowUpCircle size={12} /> Return
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div style={{ overflowX: 'auto' }} className="hidden md:block">
          <table style={{ minWidth: '750px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['ITEM', 'QTY', 'BORROWER', 'BORROWED', 'DUE DATE', 'STATUS', 'CONDITION', 'ACTIONS'].map(col => (
                  <th key={col} style={{ padding: '0.625rem 0.875rem', fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <ClipboardList size={32} style={{ opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, color: '#374151' }}>No borrowings found</div>
                    <div style={{ fontSize: '0.8rem' }}>Click "New Checkout" to get started.</div>
                  </div>
                </td></tr>
              ) : filtered.map(b => {
                const st = getStatus(b);
                const stConfig = STATUS_COLORS[st] || STATUS_COLORS.BORROWED;
                const isOverdue = st === 'OVERDUE';

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: isOverdue ? '#fff9f9' : 'transparent' }}>
                    <td style={{ padding: '0.7rem 0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '7px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {b.item.imageUrl ? <img src={b.item.imageUrl} alt={b.item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={14} color="#3b5bdb" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#1a1a2e' }}>{b.item.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                            {b.item.inventoryCode || b.itemId.slice(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a2e' }}>
                      {b.quantity || 1}
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={12} color="#6b7280" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#1a1a2e' }}>{b.borrowerName}</div>
                          {b.borrowerEmail && <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>{b.borrowerEmail}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem', fontSize: '0.78rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} />
                        {new Date(b.borrowedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {b.dueDate ? (
                        <span style={{ color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {isOverdue && <AlertTriangle size={12} />}
                          {new Date(b.dueDate).toLocaleDateString()}
                        </span>
                      ) : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: stConfig.bg,
                        color: stConfig.color
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stConfig.color }} />
                        {stConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 0.875rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                      {b.status === 'RETURNED' ? (b.returnCondition || 'Good') : (b.checkoutCondition || 'Good')}
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {b.status === 'BORROWED' && (
                          <button
                            onClick={() => setReturnModalId(b.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.75rem', fontWeight: 600,
                              border: '1px solid #10b981',
                              borderRadius: '6px',
                              backgroundColor: '#f0fdf4',
                              color: '#16a34a',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            <ArrowUpCircle size={12} /> Return
                          </button>
                        )}
                        <button
                          onClick={() => setQrItem({ id: b.item.id, name: b.item.name })}
                          style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            backgroundColor: '#fff',
                            color: '#6b7280',
                            cursor: 'pointer'
                          }}
                          title="View QR"
                        >
                          <QrCode size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
            Showing <strong style={{ color: '#374151' }}>{total === 0 ? 0 : skip + 1}</strong> – <strong style={{ color: '#374151' }}>{Math.min(skip + take, total)}</strong> of <strong style={{ color: '#374151' }}>{total}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', height: '30px', borderRadius: '6px' }} disabled={skip === 0} onClick={() => setSkip(s => Math.max(0, s - take))}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.78rem', minWidth: '60px', textAlign: 'center', color: '#6b7280' }}>
              Page {Math.floor(skip / take) + 1} of {Math.max(1, Math.ceil(total / take))}
            </span>
            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', height: '30px', borderRadius: '6px' }} disabled={skip + take >= total} onClick={() => setSkip(s => s + take)}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────── */}
      {checkoutModalOpen && (
        <CheckoutModal
          templates={templates}
          preselectedItem={checkoutPreselect}
          onClose={() => { setCheckoutModalOpen(false); setCheckoutPreselect(null); }}
          onSuccess={() => { setCheckoutModalOpen(false); setCheckoutPreselect(null); fetchBorrowings(); }}
        />
      )}

      {returnModalId && (
        <ReturnModal
          borrowingId={returnModalId}
          templates={templates}
          onClose={() => setReturnModalId(null)}
          onSuccess={() => { setReturnModalId(null); fetchBorrowings(); }}
        />
      )}

      {scanModalOpen && (
        <ScanModal
          onClose={() => setScanModalOpen(false)}
          onCheckout={(item) => { setScanModalOpen(false); setCheckoutPreselect(item); setCheckoutModalOpen(true); }}
          onReturn={(id) => { setScanModalOpen(false); setReturnModalId(id); }}
        />
      )}

      {qrItem && (
        <QRModal isOpen={!!qrItem} onClose={() => setQrItem(null)} items={[qrItem]} />
      )}
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ templates, preselectedItem, onClose, onSuccess }: {
  templates: ChecklistTemplate[];
  preselectedItem?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [itemSearch, setItemSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(preselectedItem || null);
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [supervisorName, setSupervisorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkoutTemplate = templates.find(t => t.type === 'checkout');

  useEffect(() => {
    if (itemSearch.length < 2) { setItems([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/inventory/items?search=${encodeURIComponent(itemSearch)}&take=8`)
        .then(r => r.json())
        .then(data => setItems(data.items || []))
        .catch(() => { });
    }, 300);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  const allRequiredChecked = checkoutTemplate
    ? checkoutTemplate.items.filter(i => i.required).every(i => checklist[i.id])
    : true;

  const handleSubmit = async () => {
    if (!selectedItem || !borrowerName.trim()) {
      setError('Please select an item and enter borrower name.');
      return;
    }
    if (!allRequiredChecked) {
      setError('Please complete all required checklist items.');
      return;
    }
    if (selectedItem?.isApprovalRequired && !supervisorName.trim()) {
      setError('Ministry Head approval is required for this high-value item.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          borrowerId: selectedItem.id, // fallback: use item ID; ideally use worker ID
          borrowerName: borrowerName.trim(),
          borrowerEmail: borrowerEmail.trim() || undefined,
          dueDate: dueDate || undefined,
          checkoutCondition: condition,
          checkoutNotes: selectedItem?.isApprovalRequired ? `Approved by: ${supervisorName.trim()}${notes ? ' - ' + notes : ''}` : notes,
          checkoutChecklist: checklist,
          quantity
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Checkout failed'); return; }
      onSuccess();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>New Checkout</h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Assign equipment to a borrower</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.8125rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* Item Search */}
          <div>
            <label className="form-label">Equipment *</label>
            {selectedItem ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid #3b5bdb', borderRadius: '8px', backgroundColor: '#eef2ff' }}>
                <Package size={14} color="#3b5bdb" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3b5bdb', flex: 1 }}>{selectedItem.name}</span>
                <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex' }}><X size={14} /></button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  type="text" className="form-control" placeholder="Search equipment by name…"
                  value={itemSearch} onChange={e => setItemSearch(e.target.value)}
                />
                {items.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '2px', overflow: 'hidden' }}>
                    {items.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedItem(item); setItemSearch(''); setItems([]); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                           {item.imageUrl ? <img src={item.imageUrl} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <Package size={16} color="#9ca3af" />}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1a1a2e' }}>{item.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{item.status} · {item.category?.name || ''}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedItem?.isApprovalRequired && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#be185d', fontWeight: 600, fontSize: '0.8125rem' }}>
                <ShieldAlert size={14} /> High-Value Item: Ministry Head Approval Required
              </div>
              <input type="text" className="form-control" placeholder="Name of Approving Ministry Head" value={supervisorName} onChange={e => setSupervisorName(e.target.value)} />
            </div>
          )}

          <div className="form-row-2col">
            <div>
              <label className="form-label">Quantity *</label>
              <input type="number" className="form-control" min={1} max={selectedItem ? selectedItem.stock : 1} disabled={!selectedItem} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} />
              {selectedItem && <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem' }}>Available: {selectedItem.stock}</div>}
            </div>
            <div>
              <label className="form-label">Borrower Name *</label>
              <input type="text" className="form-control" placeholder="Full name" value={borrowerName} onChange={e => setBorrowerName(e.target.value)} />
            </div>
          </div>
          <div className="form-row-2col">
            <div>
              <label className="form-label">Email (optional)</label>
              <input type="email" className="form-control" placeholder="email@example.com" value={borrowerEmail} onChange={e => setBorrowerEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-row-2col">
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-control" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="form-label">Current Condition</label>
              <select className="form-control" value={condition} onChange={e => setCondition(e.target.value)}>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
              </select>
            </div>
          </div>

          {/* Checkout Checklist */}
          {checkoutTemplate && (
            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Checkout Checklist <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                {checkoutTemplate.items.map(ci => (
                  <label key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={!!checklist[ci.id]}
                      onChange={e => setChecklist(prev => ({ ...prev, [ci.id]: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#3b5bdb', cursor: 'pointer' }}
                    />
                    <span>{ci.label}{ci.required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}</span>
                    {checklist[ci.id] && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-control" rows={2} placeholder="Any notes about this checkout…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !selectedItem || !borrowerName.trim()}
          >
            {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><ArrowDownCircle size={14} /> Confirm Checkout</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Return Modal ─────────────────────────────────────────────────────────────
function ReturnModal({ borrowingId, templates, onClose, onSuccess }: {
  borrowingId: string;
  templates: ChecklistTemplate[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [borrowing, setBorrowing] = useState<Borrowing | null>(null);
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [damaged, setDamaged] = useState(false);
  const [damageNotes, setDamageNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const returnTemplate = templates.find(t => t.type === 'return');

  useEffect(() => {
    fetch(`/api/borrowings/${borrowingId}`)
      .then(r => r.json())
      .then(setBorrowing)
      .catch(() => { });
  }, [borrowingId]);

  const allRequiredChecked = returnTemplate
    ? returnTemplate.items.filter(i => i.required).every(i => checklist[i.id])
    : true;

  const handleReturn = async () => {
    if (!allRequiredChecked) { setError('Please complete all required checklist items.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/borrowings/${borrowingId}/return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnCondition: condition,
          returnNotes: damaged ? damageNotes : notes,
          returnChecklist: checklist,
          returnPhotos: photos,
          damaged
        })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Return failed'); return; }
      onSuccess();
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Process Return</h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>
              {borrowing ? `Returning: ${borrowing.item.name}` : 'Loading…'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.8125rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {borrowing && (
            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#374151' }}>
                <strong>Borrower:</strong> {borrowing.borrowerName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#374151' }}>
                <strong>Quantity:</strong> {borrowing.quantity || 1}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#374151' }}>
                <strong>Borrowed:</strong> {new Date(borrowing.borrowedAt).toLocaleDateString()}
                {borrowing.dueDate && <> · <strong>Due:</strong> {new Date(borrowing.dueDate).toLocaleDateString()}</>}
              </div>
            </div>
          )}

          {/* Return Checklist */}
          {returnTemplate && (
            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Return Checklist <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                {returnTemplate.items.map(ci => (
                  <label key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={!!checklist[ci.id]}
                      onChange={e => setChecklist(prev => ({ ...prev, [ci.id]: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#3b5bdb', cursor: 'pointer' }}
                    />
                    <span>{ci.label}{ci.required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}</span>
                    {checklist[ci.id] && <CheckCircle size={14} color="#10b981" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Return Condition</label>
            <select className="form-control" value={condition} onChange={e => setCondition(e.target.value)}>
              <option>Good</option>
              <option>Fair</option>
              <option>Poor</option>
              <option>Damaged</option>
            </select>
          </div>

          {/* Visual Damage Proof / Photo Upload */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>Damage Proof / Return Photos (optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {photos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                  <img src={url} alt="Return Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setPhotos(p => p.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} /></button>
                </div>
              ))}
              <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', padding: 0, borderRadius: '8px', cursor: 'pointer', margin: 0, backgroundColor: '#f9fafb' }}>
                {uploadingImage ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} color="#9ca3af" />}
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingImage} onChange={async e => {
                   if (!e.target.files?.length) return;
                   setUploadingImage(true);
                   try {
                     const url = await uploadItemPhoto(e.target.files[0]);
                     setPhotos(p => [...p, url]);
                   } catch { alert('Upload failed'); }
                   finally { setUploadingImage(false); }
                }} />
              </label>
            </div>
          </div>

          {/* Damage Flag */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', borderRadius: '8px', border: `1px solid ${damaged ? '#fecaca' : '#e5e7eb'}`, backgroundColor: damaged ? '#fef2f2' : '#f9fafb' }}>
            <input
              type="checkbox"
              checked={damaged}
              onChange={e => setDamaged(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#dc2626', cursor: 'pointer' }}
            />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: damaged ? '#dc2626' : '#374151' }}>Mark as Damaged</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Item status will be updated to "Damaged"</div>
            </div>
          </label>

          {damaged && (
            <div>
              <label className="form-label">Damage Description *</label>
              <textarea className="form-control" rows={2} placeholder="Describe the damage…" value={damageNotes} onChange={e => setDamageNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          )}

          {!damaged && (
            <div>
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-control" rows={2} placeholder="Any notes about this return…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: damaged ? '#dc2626' : '#10b981', borderColor: damaged ? '#dc2626' : '#10b981' }}
            onClick={handleReturn}
            disabled={loading || (damaged && !damageNotes.trim())}
          >
            {loading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</> : <><ArrowUpCircle size={14} /> {damaged ? 'Return (Damaged)' : 'Confirm Return'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scan Modal ────────────────────────────────────────────────────────────────
function ScanModal({ onClose, onCheckout, onReturn }: {
  onClose: () => void;
  onCheckout: (item: any) => void;
  onReturn: (borrowingId: string) => void;
}) {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleScanAPI = async (payload: string) => {
    if (!payload.trim()) return;
    setScanning(true);
    setError('');
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Item not found'); return; }
      setScanResult(data);
    } catch {
      setError('Scan failed. Check network connection.');
    } finally {
      setScanning(false);
      setIsCameraOpen(false);
    }
  };

  const handleScan = () => handleScanAPI(qrInput);

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }}>
      {isCameraOpen && (
        <ScannerModal 
          onClose={() => setIsCameraOpen(false)} 
          onScan={(data) => {
            setQrInput(data);
            handleScanAPI(data);
          }} 
        />
      )}
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Scan to Action</h3>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Enter a QR code payload to look up an item</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', backgroundColor: '#f9fafb', borderRadius: '10px', border: '2px dashed #e5e7eb' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
              <QrCode size={40} color="#3b5bdb" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
              <button className="btn btn-primary" style={{ fontSize: '0.78rem' }} onClick={() => setIsCameraOpen(true)}>
                Start Camera Scanner
              </button>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Or type the QR payload manually below:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                autoFocus
              />
              <button
                className="btn btn-primary"
                style={{ flexShrink: 0 }}
                onClick={handleScan}
                disabled={scanning || !qrInput.trim()}
              >
                {scanning ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Look Up'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.8125rem' }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.35rem' }} /> {error}
            </div>
          )}

          {scanResult && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1a1a2e' }}>{scanResult.item.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                  {scanResult.item.inventoryCode || scanResult.item.id.slice(0, 8)} · {scanResult.item.category?.name}
                </div>
              </div>
              <div style={{ padding: '0.875rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Status:</span>
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: scanResult.item.status === 'Borrowed' ? '#fffbeb' : scanResult.item.status === 'Damaged' ? '#fef2f2' : '#f0fdf4',
                    color: scanResult.item.status === 'Borrowed' ? '#d97706' : scanResult.item.status === 'Damaged' ? '#dc2626' : '#16a34a'
                  }}>
                    {scanResult.item.status}
                  </span>
                </div>
                {scanResult.activeBorrowing && (
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Borrowed by: <strong>{scanResult.activeBorrowing.borrowerName}</strong>
                    {scanResult.activeBorrowing.dueDate && <> · Due: {new Date(scanResult.activeBorrowing.dueDate).toLocaleDateString()}</>}
                  </div>
                )}
              </div>
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                {scanResult.activeBorrowing ? (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, backgroundColor: '#10b981' }}
                    onClick={() => onReturn(scanResult.activeBorrowing.id)}
                  >
                    <ArrowUpCircle size={14} /> Check IN (Return)
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => onCheckout(scanResult.item)}
                  >
                    <ArrowDownCircle size={14} /> Check OUT
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
