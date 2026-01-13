"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { FaqItem } from "@/hooks/useSiteSettings";

type AdminSettingsDoc = {
  _id?: string;
  singletonKey?: string;
  bannerText?: string;
  support?: { whatsappNumber?: string; supportEmail?: string };
  footer?: { disclaimer?: string; dataSafetyNote?: string };
  faq?: {
    global?: FaqItem[];
    payment?: FaqItem[];
    applyWork?: FaqItem[];
    orderSupport?: FaqItem[];
  };
  updatedAt?: string;
  updatedBy?: any;
};

const normalizeFaq = (value: any): FaqItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => ({ q: String(x?.q || ""), a: String(x?.a || "") }))
    .map((x) => ({ q: x.q.trim(), a: x.a.trim() }))
    .filter((x) => x.q && x.a)
    .slice(0, 25);
};

const emptyFaq = (): FaqItem[] => [];

export default function AdminCmsSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"general" | "footer" | "faq">("general");

  const [bannerText, setBannerText] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const [disclaimer, setDisclaimer] = useState("");
  const [dataSafetyNote, setDataSafetyNote] = useState("");

  const [faqGlobal, setFaqGlobal] = useState<FaqItem[]>(emptyFaq());
  const [faqPayment, setFaqPayment] = useState<FaqItem[]>(emptyFaq());
  const [faqApplyWork, setFaqApplyWork] = useState<FaqItem[]>(emptyFaq());
  const [faqOrderSupport, setFaqOrderSupport] = useState<FaqItem[]>(emptyFaq());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const doc = await apiRequest<AdminSettingsDoc>(
        "/api/admin/settings",
        "GET",
        null,
        true
      );

      setBannerText(String(doc?.bannerText || ""));
      setWhatsappNumber(String(doc?.support?.whatsappNumber || ""));
      setSupportEmail(String(doc?.support?.supportEmail || ""));

      setDisclaimer(String(doc?.footer?.disclaimer || ""));
      setDataSafetyNote(String(doc?.footer?.dataSafetyNote || ""));

      setFaqGlobal(normalizeFaq(doc?.faq?.global));
      setFaqPayment(normalizeFaq(doc?.faq?.payment));
      setFaqApplyWork(normalizeFaq(doc?.faq?.applyWork));
      setFaqOrderSupport(normalizeFaq(doc?.faq?.orderSupport));
    } catch (e: any) {
      const msg = e?.message || "Failed to load settings";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = useMemo(
    () => [
      { key: "general" as const, label: "General" },
      { key: "footer" as const, label: "Footer" },
      { key: "faq" as const, label: "FAQ Manager" },
    ],
    []
  );

  const setFaqAt = (
    list: FaqItem[],
    idx: number,
    patch: Partial<FaqItem>
  ): FaqItem[] => {
    return list.map((it, i) => (i === idx ? { ...it, ...patch } : it));
  };

  type FaqSetter = React.Dispatch<React.SetStateAction<FaqItem[]>>;

  const addFaq = (setter: FaqSetter) => {
    setter((cur) => {
      if (cur.length >= 25) return cur;
      return [...cur, { q: "", a: "" }];
    });
  };

  const removeFaq = (setter: FaqSetter, idx: number) => {
    setter((cur) => cur.filter((_, i) => i !== idx));
  };

  const sanitizeFaqBeforeSave = (list: FaqItem[]): FaqItem[] => {
    return list
      .map((x) => ({
        q: String(x.q || "").trim(),
        a: String(x.a || "").trim(),
      }))
      .filter((x) => x.q && x.a)
      .slice(0, 25);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        bannerText: bannerText.trim(),
        support: {
          whatsappNumber: whatsappNumber.trim(),
          supportEmail: supportEmail.trim(),
        },
        footer: {
          disclaimer: disclaimer.trim(),
          dataSafetyNote: dataSafetyNote.trim(),
        },
        faq: {
          global: sanitizeFaqBeforeSave(faqGlobal),
          payment: sanitizeFaqBeforeSave(faqPayment),
          applyWork: sanitizeFaqBeforeSave(faqApplyWork),
          orderSupport: sanitizeFaqBeforeSave(faqOrderSupport),
        },
      };

      await apiRequest("/api/admin/settings", "PUT", payload, true);
      toast("CMS settings saved", "success");
      await load();
    } catch (e: any) {
      const msg = e?.message || "Save failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Loading...</div>;
  }

  return (
    <div className="u-container max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">CMS Settings</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Edit banner, footer copy, and FAQs without code changes.
          </p>
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary w-full sm:w-auto disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl border text-sm transition ${
                active
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "general" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold">Banner notice</h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Appears at the top of most pages.
            </p>
            <textarea
              className="u-input mt-3 min-h-[110px]"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="Site notice banner text"
            />
          </div>

          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold">Support WhatsApp</h2>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Optional. If empty, frontend falls back to environment default.
              </p>
              <input
                className="u-input mt-3"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. +919749040727"
              />
            </div>

            <div>
              <h2 className="font-semibold">Support email</h2>
              <input
                className="u-input mt-3"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@uremo.online"
              />
            </div>
          </div>
        </div>
      )}

      {tab === "footer" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold">Disclaimer</h2>
            <p className="text-xs text-[#9CA3AF] mt-1">Shown in site footer.</p>
            <textarea
              className="u-input mt-3 min-h-[140px]"
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              placeholder="Independent provider disclaimer"
            />
          </div>

          <div className="card">
            <h2 className="font-semibold">Data safety note</h2>
            <p className="text-xs text-[#9CA3AF] mt-1">Shown in site footer.</p>
            <textarea
              className="u-input mt-3 min-h-[140px]"
              value={dataSafetyNote}
              onChange={(e) => setDataSafetyNote(e.target.value)}
              placeholder="Data safety / privacy note"
            />
          </div>
        </div>
      )}

      {tab === "faq" && (
        <div className="space-y-6">
          <FaqEditor
            title="Global FAQ"
            items={faqGlobal}
            onChange={setFaqGlobal}
            onAdd={() => addFaq(setFaqGlobal)}
            onDelete={(idx) => removeFaq(setFaqGlobal, idx)}
            setFaqAt={setFaqAt}
          />

          <FaqEditor
            title="Payment Page FAQ"
            items={faqPayment}
            onChange={setFaqPayment}
            onAdd={() => addFaq(setFaqPayment)}
            onDelete={(idx) => removeFaq(setFaqPayment, idx)}
            setFaqAt={setFaqAt}
          />

          <FaqEditor
            title="Apply-to-work FAQ"
            items={faqApplyWork}
            onChange={setFaqApplyWork}
            onAdd={() => addFaq(setFaqApplyWork)}
            onDelete={(idx) => removeFaq(setFaqApplyWork, idx)}
            setFaqAt={setFaqAt}
          />

          <FaqEditor
            title="Order Support Guide"
            items={faqOrderSupport}
            onChange={setFaqOrderSupport}
            onAdd={() => addFaq(setFaqOrderSupport)}
            onDelete={(idx) => removeFaq(setFaqOrderSupport, idx)}
            setFaqAt={setFaqAt}
          />
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary w-full sm:w-auto disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function FaqEditor(props: {
  title: string;
  items: FaqItem[];
  onChange: (next: FaqItem[]) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  setFaqAt: (
    list: FaqItem[],
    idx: number,
    patch: Partial<FaqItem>
  ) => FaqItem[];
}) {
  const items = Array.isArray(props.items) ? props.items : [];

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">{props.title}</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Max 25 items. Empty Q/A rows are ignored on save.
          </p>
        </div>

        <button type="button" onClick={props.onAdd} className="btn-secondary">
          + Add QA
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {items.length === 0 && (
          <div className="text-sm text-[#9CA3AF]">No items yet.</div>
        )}

        {items.map((item, idx) => (
          <div
            key={`${idx}`}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[#9CA3AF]">Item {idx + 1}</p>
              <button
                type="button"
                onClick={() => props.onDelete(idx)}
                className="text-xs text-red-200 hover:text-red-100"
              >
                Delete
              </button>
            </div>

            <label className="block text-xs text-[#9CA3AF] mt-3">
              Question
            </label>
            <input
              className="u-input mt-2"
              value={item.q}
              onChange={(e) =>
                props.onChange(
                  props.setFaqAt(items, idx, { q: e.target.value })
                )
              }
              placeholder="Question"
            />

            <label className="block text-xs text-[#9CA3AF] mt-3">Answer</label>
            <textarea
              className="u-input mt-2 min-h-[90px]"
              value={item.a}
              onChange={(e) =>
                props.onChange(
                  props.setFaqAt(items, idx, { a: e.target.value })
                )
              }
              placeholder="Answer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
