"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { FaqItem, TitleDesc } from "@/hooks/useSiteSettings";

type AdminSettingsDoc = {
  _id?: string;
  singletonKey?: string;
  // Legacy fallback (older backend stored bannerText at root)
  bannerText?: string;
  site?: { brandName?: string; bannerText?: string };
  support?: { whatsappNumber?: string; supportEmail?: string };
  footer?: { disclaimer?: string; dataSafetyNote?: string };
  landing?: {
    heroTitle?: string;
    heroSubtitle?: string;
    ctaPrimaryText?: string;
    ctaSecondaryText?: string;
    features?: TitleDesc[];
    popularTitle?: string;
    popularSubtitle?: string;
    finalCtaTitle?: string;
    finalCtaSubtitle?: string;
  };
  payment?: {
    beginnerSteps?: TitleDesc[];
    acceptedProofText?: string;
    successRedirectText?: string;
    faq?: FaqItem[];
  };
  services?: { globalFaq?: FaqItem[]; trustBlockText?: string };
  orderSupport?: { quickReplies?: string[]; supportGuidelines?: string };
  applyWork?: { faq?: FaqItem[] };
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

const normalizeTitleDesc = (value: any): TitleDesc[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => ({
      title: String(x?.title || ""),
      desc: String(x?.desc || ""),
    }))
    .map((x) => ({ title: x.title.trim(), desc: x.desc.trim() }))
    .filter((x) => x.title && x.desc)
    .slice(0, 12);
};

const normalizeStringArray = (value: any): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const setAt = <T,>(list: T[], idx: number, patch: Partial<T>): T[] => {
  return list.map((it, i) => (i === idx ? { ...it, ...patch } : it));
};

export default function AdminCmsSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<
    | "global"
    | "landing"
    | "payment"
    | "services"
    | "orderSupport"
    | "applyWork"
    | "footer"
  >("global");

  // Global
  const [brandName, setBrandName] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  // Landing
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [ctaPrimaryText, setCtaPrimaryText] = useState("");
  const [ctaSecondaryText, setCtaSecondaryText] = useState("");
  const [features, setFeatures] = useState<TitleDesc[]>([]);
  const [popularTitle, setPopularTitle] = useState("");
  const [popularSubtitle, setPopularSubtitle] = useState("");
  const [finalCtaTitle, setFinalCtaTitle] = useState("");
  const [finalCtaSubtitle, setFinalCtaSubtitle] = useState("");

  // Payment
  const [beginnerSteps, setBeginnerSteps] = useState<TitleDesc[]>([]);
  const [acceptedProofText, setAcceptedProofText] = useState("");
  const [successRedirectText, setSuccessRedirectText] = useState("");
  const [paymentFaq, setPaymentFaq] = useState<FaqItem[]>([]);

  // Services
  const [trustBlockText, setTrustBlockText] = useState("");
  const [globalFaq, setGlobalFaq] = useState<FaqItem[]>([]);

  // Order Support
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [supportGuidelines, setSupportGuidelines] = useState("");

  // Apply Work
  const [applyWorkFaq, setApplyWorkFaq] = useState<FaqItem[]>([]);

  // Footer
  const [disclaimer, setDisclaimer] = useState("");
  const [dataSafetyNote, setDataSafetyNote] = useState("");

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

      setBrandName(String(doc?.site?.brandName || ""));
      setBannerText(String(doc?.site?.bannerText || doc?.bannerText || ""));
      setWhatsappNumber(String(doc?.support?.whatsappNumber || ""));
      setSupportEmail(String(doc?.support?.supportEmail || ""));

      setHeroTitle(String(doc?.landing?.heroTitle || ""));
      setHeroSubtitle(String(doc?.landing?.heroSubtitle || ""));
      setCtaPrimaryText(String(doc?.landing?.ctaPrimaryText || ""));
      setCtaSecondaryText(String(doc?.landing?.ctaSecondaryText || ""));
      setFeatures(normalizeTitleDesc(doc?.landing?.features));
      setPopularTitle(String(doc?.landing?.popularTitle || ""));
      setPopularSubtitle(String(doc?.landing?.popularSubtitle || ""));
      setFinalCtaTitle(String(doc?.landing?.finalCtaTitle || ""));
      setFinalCtaSubtitle(String(doc?.landing?.finalCtaSubtitle || ""));

      setBeginnerSteps(normalizeTitleDesc(doc?.payment?.beginnerSteps));
      setAcceptedProofText(String(doc?.payment?.acceptedProofText || ""));
      setSuccessRedirectText(String(doc?.payment?.successRedirectText || ""));
      setPaymentFaq(normalizeFaq(doc?.payment?.faq));

      setTrustBlockText(String(doc?.services?.trustBlockText || ""));
      setGlobalFaq(normalizeFaq(doc?.services?.globalFaq));

      setQuickReplies(normalizeStringArray(doc?.orderSupport?.quickReplies));
      setSupportGuidelines(String(doc?.orderSupport?.supportGuidelines || ""));

      setApplyWorkFaq(normalizeFaq(doc?.applyWork?.faq));

      setDisclaimer(String(doc?.footer?.disclaimer || ""));
      setDataSafetyNote(String(doc?.footer?.dataSafetyNote || ""));
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
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
      { key: "global" as const, label: "Global" },
      { key: "landing" as const, label: "Landing" },
      { key: "payment" as const, label: "Payment" },
      { key: "services" as const, label: "Services" },
      { key: "orderSupport" as const, label: "Order Support" },
      { key: "applyWork" as const, label: "Apply Work" },
      { key: "footer" as const, label: "Footer" },
    ],
    []
  );

  const sanitizeFaqBeforeSave = (list: FaqItem[]): FaqItem[] => {
    return list
      .map((x) => ({
        q: String(x.q || "").trim(),
        a: String(x.a || "").trim(),
      }))
      .filter((x) => x.q && x.a)
      .slice(0, 25);
  };
  const sanitizeTitleDescBeforeSave = (list: TitleDesc[]): TitleDesc[] => {
    return list
      .map((x) => ({
        title: String(x.title || "").trim(),
        desc: String(x.desc || "").trim(),
      }))
      .filter((x) => x.title && x.desc)
      .slice(0, 12);
  };
  const sanitizeStringArrayBeforeSave = (list: string[]): string[] => {
    return list
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 10);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        site: {
          brandName: brandName.trim(),
          bannerText: bannerText.trim(),
        },
        support: {
          whatsappNumber: whatsappNumber.trim(),
          supportEmail: supportEmail.trim(),
        },
        footer: {
          disclaimer: disclaimer.trim(),
          dataSafetyNote: dataSafetyNote.trim(),
        },
        landing: {
          heroTitle: heroTitle.trim(),
          heroSubtitle: heroSubtitle.trim(),
          ctaPrimaryText: ctaPrimaryText.trim(),
          ctaSecondaryText: ctaSecondaryText.trim(),
          features: sanitizeTitleDescBeforeSave(features),
          popularTitle: popularTitle.trim(),
          popularSubtitle: popularSubtitle.trim(),
          finalCtaTitle: finalCtaTitle.trim(),
          finalCtaSubtitle: finalCtaSubtitle.trim(),
        },
        payment: {
          beginnerSteps: sanitizeTitleDescBeforeSave(beginnerSteps),
          acceptedProofText: acceptedProofText.trim(),
          successRedirectText: successRedirectText.trim(),
          faq: sanitizeFaqBeforeSave(paymentFaq),
        },
        services: {
          trustBlockText: trustBlockText.trim(),
          globalFaq: sanitizeFaqBeforeSave(globalFaq),
        },
        orderSupport: {
          quickReplies: sanitizeStringArrayBeforeSave(quickReplies),
          supportGuidelines: supportGuidelines.trim(),
        },
        applyWork: {
          faq: sanitizeFaqBeforeSave(applyWorkFaq),
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

  if (loading) return <div className="p-6 text-slate-400">Loading...</div>;

  return (
    <div className="u-container max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">CMS Settings</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Update site copy and FAQs without code changes.
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

      {tab === "global" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="font-semibold">Brand</h2>
            <label className="block text-xs text-[#9CA3AF] mt-3">
              Brand name
            </label>
            <input
              className="u-input mt-2"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="UREMO"
            />

            <label className="block text-xs text-[#9CA3AF] mt-4">
              Banner notice
            </label>
            <textarea
              className="u-input mt-2 min-h-[110px]"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="Site notice banner text"
            />
          </div>

          <div className="card">
            <h2 className="font-semibold">Support</h2>
            <label className="block text-xs text-[#9CA3AF] mt-3">
              WhatsApp (optional)
            </label>
            <input
              className="u-input mt-2"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. +919749040727"
            />

            <label className="block text-xs text-[#9CA3AF] mt-4">
              Support email
            </label>
            <input
              className="u-input mt-2"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@uremo.online"
            />
          </div>
        </div>
      )}

      {tab === "landing" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold">Hero</h2>
              <label className="block text-xs text-[#9CA3AF] mt-3">Title</label>
              <input
                className="u-input mt-2"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Verified Digital Onboarding & Marketplace"
              />
              <label className="block text-xs text-[#9CA3AF] mt-4">
                Subtitle
              </label>
              <textarea
                className="u-input mt-2 min-h-[110px]"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Short supporting copy"
              />
            </div>

            <div className="card">
              <h2 className="font-semibold">CTA Buttons</h2>
              <label className="block text-xs text-[#9CA3AF] mt-3">
                Primary CTA text
              </label>
              <input
                className="u-input mt-2"
                value={ctaPrimaryText}
                onChange={(e) => setCtaPrimaryText(e.target.value)}
                placeholder="Browse services"
              />
              <label className="block text-xs text-[#9CA3AF] mt-4">
                Secondary CTA text
              </label>
              <input
                className="u-input mt-2"
                value={ctaSecondaryText}
                onChange={(e) => setCtaSecondaryText(e.target.value)}
                placeholder="How it works"
              />
            </div>
          </div>

          <TitleDescEditor
            title="Feature cards"
            hint="Shown on the landing page. Max 8 items. Empty rows are ignored on save."
            items={features}
            onChange={setFeatures}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold">Popular section</h2>
              <label className="block text-xs text-[#9CA3AF] mt-3">Title</label>
              <input
                className="u-input mt-2"
                value={popularTitle}
                onChange={(e) => setPopularTitle(e.target.value)}
                placeholder="Popular services"
              />
              <label className="block text-xs text-[#9CA3AF] mt-4">
                Subtitle
              </label>
              <textarea
                className="u-input mt-2 min-h-[90px]"
                value={popularSubtitle}
                onChange={(e) => setPopularSubtitle(e.target.value)}
                placeholder="Start with our most-requested manual operations."
              />
            </div>

            <div className="card">
              <h2 className="font-semibold">Final CTA</h2>
              <label className="block text-xs text-[#9CA3AF] mt-3">Title</label>
              <input
                className="u-input mt-2"
                value={finalCtaTitle}
                onChange={(e) => setFinalCtaTitle(e.target.value)}
                placeholder="Ready to start?"
              />
              <label className="block text-xs text-[#9CA3AF] mt-4">
                Subtitle
              </label>
              <textarea
                className="u-input mt-2 min-h-[90px]"
                value={finalCtaSubtitle}
                onChange={(e) => setFinalCtaSubtitle(e.target.value)}
                placeholder="Create an account, reserve a service, and complete payment."
              />
            </div>
          </div>
        </div>
      )}

      {tab === "payment" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold">Payment copy</h2>
              <label className="block text-xs text-[#9CA3AF] mt-3">
                Accepted proof text
              </label>
              <textarea
                className="u-input mt-2 min-h-[90px]"
                value={acceptedProofText}
                onChange={(e) => setAcceptedProofText(e.target.value)}
                placeholder="Accepted proof: Screenshot/PDF with transaction ID…"
              />
              <label className="block text-xs text-[#9CA3AF] mt-4">
                Success redirect text
              </label>
              <textarea
                className="u-input mt-2 min-h-[90px]"
                value={successRedirectText}
                onChange={(e) => setSuccessRedirectText(e.target.value)}
                placeholder="Payment received…"
              />
            </div>

            <TitleDescEditor
              title="Beginner steps"
              hint="Optional helper content. Max 10 items."
              items={beginnerSteps}
              onChange={setBeginnerSteps}
            />
          </div>

          <FaqEditor
            title="Payment FAQ"
            items={paymentFaq}
            onChange={setPaymentFaq}
          />
        </div>
      )}

      {tab === "services" && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold">Trust block text</h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Reused across service listings/details as general marketing copy.
            </p>
            <textarea
              className="u-input mt-3 min-h-[110px]"
              value={trustBlockText}
              onChange={(e) => setTrustBlockText(e.target.value)}
              placeholder="UREMO delivers manual operations…"
            />
          </div>

          <FaqEditor
            title="Global services FAQ"
            items={globalFaq}
            onChange={setGlobalFaq}
          />
        </div>
      )}

      {tab === "orderSupport" && (
        <div className="space-y-6">
          <StringListEditor
            title="Quick replies"
            hint="Shown as one-tap buttons in order chat. Max 10 items."
            items={quickReplies}
            onChange={setQuickReplies}
            placeholder="Type a quick reply and press Add"
          />

          <div className="card">
            <h2 className="font-semibold">Support guidelines</h2>
            <p className="text-xs text-[#9CA3AF] mt-1">
              Short helper text shown near the chat box.
            </p>
            <textarea
              className="u-input mt-3 min-h-[110px]"
              value={supportGuidelines}
              onChange={(e) => setSupportGuidelines(e.target.value)}
              placeholder="Share your order issue and any relevant proof…"
            />
          </div>
        </div>
      )}

      {tab === "applyWork" && (
        <div className="space-y-6">
          <FaqEditor
            title="Apply-to-work FAQ"
            items={applyWorkFaq}
            onChange={setApplyWorkFaq}
          />
        </div>
      )}

      {tab === "footer" && (
        <div className="grid gap-6 lg:grid-cols-2">
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
}) {
  const items = Array.isArray(props.items) ? props.items : [];

  const add = () => {
    props.onChange(
      (items.length >= 25 ? items : [...items, { q: "", a: "" }]).slice(0, 25)
    );
  };

  const remove = (idx: number) => {
    props.onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">{props.title}</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Max 25 items. Empty Q/A rows are ignored on save.
          </p>
        </div>

        <button type="button" onClick={add} className="btn-secondary">
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
                onClick={() => remove(idx)}
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
                props.onChange(setAt(items, idx, { q: e.target.value }))
              }
              placeholder="Question"
            />

            <label className="block text-xs text-[#9CA3AF] mt-3">Answer</label>
            <textarea
              className="u-input mt-2 min-h-[90px]"
              value={item.a}
              onChange={(e) =>
                props.onChange(setAt(items, idx, { a: e.target.value }))
              }
              placeholder="Answer"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TitleDescEditor(props: {
  title: string;
  hint: string;
  items: TitleDesc[];
  onChange: (next: TitleDesc[]) => void;
}) {
  const items = Array.isArray(props.items) ? props.items : [];
  const add = () => {
    if (items.length >= 12) return;
    props.onChange([...items, { title: "", desc: "" }]);
  };
  const remove = (idx: number) =>
    props.onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">{props.title}</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">{props.hint}</p>
        </div>
        <button type="button" onClick={add} className="btn-secondary">
          + Add
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
                onClick={() => remove(idx)}
                className="text-xs text-red-200 hover:text-red-100"
              >
                Delete
              </button>
            </div>

            <label className="block text-xs text-[#9CA3AF] mt-3">Title</label>
            <input
              className="u-input mt-2"
              value={item.title}
              onChange={(e) =>
                props.onChange(setAt(items, idx, { title: e.target.value }))
              }
              placeholder="Title"
            />

            <label className="block text-xs text-[#9CA3AF] mt-3">
              Description
            </label>
            <textarea
              className="u-input mt-2 min-h-[90px]"
              value={item.desc}
              onChange={(e) =>
                props.onChange(setAt(items, idx, { desc: e.target.value }))
              }
              placeholder="Description"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StringListEditor(props: {
  title: string;
  hint: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const items = Array.isArray(props.items) ? props.items : [];
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    const next = [...items, v].slice(0, 10);
    props.onChange(next);
    setDraft("");
  };

  const remove = (idx: number) => {
    props.onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">{props.title}</h2>
          <p className="text-xs text-[#9CA3AF] mt-1">{props.hint}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        <input
          className="u-input flex-1 min-w-[220px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={props.placeholder}
        />
        <button type="button" onClick={add} className="btn-secondary">
          Add
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 && (
          <div className="text-sm text-[#9CA3AF]">No items yet.</div>
        )}
        {items.map((t, idx) => (
          <div
            key={`${idx}-${t}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={() => remove(idx)}
              className="text-red-200 hover:text-red-100"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
