"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "./ui";

const TOGGLES = [
  {
    key: "new-inquiry",
    label: "New inquiry alerts",
    text: "Email the moment a buyer opens a thread.",
    on: true,
  },
  {
    key: "lead-match",
    label: "Lead match digest",
    text: "Daily summary of requirements scoring above 70%.",
    on: true,
  },
  {
    key: "verification",
    label: "Verification reminders",
    text: "Expiring certificates and audit scheduling.",
    on: true,
  },
  {
    key: "product-news",
    label: "Platform announcements",
    text: "New features, policy changes and marketplace news.",
    on: false,
  },
];

export default function SettingsForm() {
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(TOGGLES.map((item) => [item.key, item.on]))
  );
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display language">
            <Select name="language" defaultValue="English">
              <option>English</option>
              <option>বাংলা</option>
              <option>Deutsch</option>
              <option>Français</option>
            </Select>
          </Field>
          <Field label="Currency">
            <Select name="currency" defaultValue="USD">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>BDT</option>
              <option>AED</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time zone">
            <Select name="timezone" defaultValue="Asia/Dhaka">
              <option>Asia/Dhaka</option>
              <option>Europe/Berlin</option>
              <option>Europe/London</option>
              <option>Asia/Dubai</option>
            </Select>
          </Field>
          <Field label="Quote currency for RFQs">
            <Select name="quoteCurrency" defaultValue="USD">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </Select>
          </Field>
        </div>

        <Field label="Saved reply — first response">
          <Textarea
            name="savedReply"
            rows={3}
            defaultValue="Thank you for your inquiry. Attached are our current specs and indicative pricing for the requested grade. Sample dispatch takes 3–5 working days."
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="navy">
            Save preferences
          </Button>
          {saved ? (
            <span className="text-[13px] font-semibold text-success">
              Preferences saved.
            </span>
          ) : null}
        </div>
      </form>

      <div className="border-t border-slate-100 pt-5">
        <p className="label-xs">Notifications</p>
        <div className="mt-3 space-y-3">
          {TOGGLES.map((item) => (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-[13px] text-slate-500">{item.text}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={toggles[item.key]}
                aria-label={item.label}
                onClick={() => {
                  setToggles((state) => ({
                    ...state,
                    [item.key]: !state[item.key],
                  }));
                  setSaved(false);
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  toggles[item.key] ? "bg-success" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    toggles[item.key] ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-display text-base font-bold text-red-700">
          Account actions
        </p>
        <p className="mt-1 text-[13px] leading-6 text-red-600">
          Export your trade records or request account closure. Suspension of an
          active membership is handled by finance first.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="outline" size="sm">
            Export records
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            Close account
          </Button>
        </div>
      </div>
    </div>
  );
}
