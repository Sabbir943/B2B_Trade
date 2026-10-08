"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "./ui";
import { updatePricingSettings } from "../lib/actions";
import { BADGE_OPTIONS, RANKING_OPTIONS } from "../lib/pricing";

/**
 * Super Admin editor for the pricing settings document (spec §9).
 * All state is local until "Publish settings" runs the server action, which
 * re-validates every value, writes the document and audits the diff.
 */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getIn(source, path) {
  return path.split(".").reduce((node, key) => (node == null ? node : node[key]), source);
}

function setIn(node, path, value) {
  const [head, ...rest] = path.split(".");
  const next = Array.isArray(node) ? [...node] : { ...node };
  next[head] = rest.length ? setIn(node[head], rest.join("."), value) : value;
  return next;
}

function TextField({ label, path, value, onChange, type = "text", hint, placeholder, min, max }) {
  return (
    <Field label={label} hint={hint}>
      <Input
        id={path}
        type={type}
        min={min}
        max={max}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange(path, event.target.value)}
      />
    </Field>
  );
}

function SelectField({ label, path, value, onChange, options, hint }) {
  return (
    <Field label={label} hint={hint}>
      <Select id={path} value={value ?? ""} onChange={(event) => onChange(path, event.target.value)}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function Toggle({ label, path, checked, onChange, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition hover:border-primary/40">
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(path, event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{hint}</span> : null}
      </span>
    </label>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold text-primary">{title}</h2>
      </div>
      {description ? (
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function PricingSettingsForm({ initial, spots }) {
  const [settings, setSettings] = useState(() => clone(initial));
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);

  const update = (path, value) => {
    setSettings((previous) => setIn(previous, path, value));
    setResult(null);
  };

  async function onSubmit(event) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const response = await updatePricingSettings(settings);
      setResult(response);
    } finally {
      setPending(false);
    }
  }

  const tiers = settings.tiers;
  const fees = settings.serviceFees;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionCard
        title="Founding offer"
        description="First-year discount for early paid members. The counter below is the real number of paid sign-ups, not a seeded figure."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-surface p-4 xl:col-span-1">
            <p className="label-xs">Spots left</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">
              {settings.founding.enabled ? spots.left : "—"}
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              {spots.taken} claimed of {spots.total}
            </p>
          </div>
          <TextField
            label="Headline"
            path="founding.headline"
            value={settings.founding.headline}
            onChange={update}
          />
          <TextField
            label="Counter label"
            path="founding.counterLabel"
            value={settings.founding.counterLabel}
            onChange={update}
          />
          <TextField
            label="Discount (%)"
            path="founding.discountPercent"
            value={settings.founding.discountPercent}
            onChange={update}
            type="number"
            min={0}
            max={100}
          />
          <TextField
            label="Paid spots available"
            path="founding.totalSpots"
            value={settings.founding.totalSpots}
            onChange={update}
            type="number"
            min={1}
            hint="Founding offer closes once this many paid members have joined."
          />
          <div className="sm:col-span-2 xl:col-span-3">
            <Toggle
              label="Founding offer live"
              path="founding.enabled"
              checked={settings.founding.enabled}
              onChange={update}
              hint="When off, every tier bills at its standard list price."
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Tier prices (yearly)"
        description="Billed yearly in USD and BDT. The founding price is the first-year price while the offer lasts and can never exceed the list price."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier, index) => (
            <div key={tier.key} className="rounded-xl border border-slate-200 bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="label-xs">{tier.key}</p>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={Boolean(tier.featured)}
                    onChange={(event) => update(`tiers.${index}.featured`, event.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Featured
                </label>
              </div>
              <div className="mt-3 space-y-3">
                <TextField
                  label="Tier name"
                  path={`tiers.${index}.name`}
                  value={tier.name}
                  onChange={update}
                />
                <TextField
                  label="Blurb"
                  path={`tiers.${index}.blurb`}
                  value={tier.blurb}
                  onChange={update}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="List USD"
                    path={`tiers.${index}.priceUsd`}
                    value={tier.priceUsd}
                    onChange={update}
                    type="number"
                    min={0}
                  />
                  <TextField
                    label="List BDT"
                    path={`tiers.${index}.priceBdt`}
                    value={tier.priceBdt}
                    onChange={update}
                    type="number"
                    min={0}
                  />
                  <TextField
                    label="Founding USD"
                    path={`tiers.${index}.foundingUsd`}
                    value={tier.foundingUsd}
                    onChange={update}
                    type="number"
                    min={0}
                  />
                  <TextField
                    label="Founding BDT"
                    path={`tiers.${index}.foundingBdt`}
                    value={tier.foundingBdt}
                    onChange={update}
                    type="number"
                    min={0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Tier limits & features"
        description="These values drive the plan comparison table and every member-facing limit — nothing is hard-coded on the pages."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier, index) => (
            <div key={tier.key} className="rounded-xl border border-slate-200 bg-surface p-4">
              <p className="label-xs">{tier.name}</p>
              <div className="mt-3 space-y-3">
                <TextField
                  label="Product listings"
                  path={`tiers.${index}.limits.productListings`}
                  value={tier.limits.productListings}
                  onChange={update}
                  type="number"
                  min={0}
                />
                <Toggle
                  label="Unlimited listings"
                  path={`tiers.${index}.limits.productListingsUnlimited`}
                  checked={tier.limits.productListingsUnlimited}
                  onChange={update}
                />
                <TextField
                  label="Direct contacts / day"
                  path={`tiers.${index}.limits.directContactsPerDay`}
                  value={tier.limits.directContactsPerDay}
                  onChange={update}
                  type="number"
                  min={0}
                />
                <TextField
                  label="Buy lead access"
                  path={`tiers.${index}.limits.buyLeadAccess`}
                  value={tier.limits.buyLeadAccess}
                  onChange={update}
                  hint="How soon this tier sees a new buy lead."
                />
                <SelectField
                  label="Search ranking"
                  path={`tiers.${index}.limits.searchRanking`}
                  value={tier.limits.searchRanking}
                  onChange={update}
                  options={RANKING_OPTIONS}
                />
                <SelectField
                  label="Document Verified badge"
                  path={`tiers.${index}.limits.documentVerified`}
                  value={tier.limits.documentVerified}
                  onChange={update}
                  options={BADGE_OPTIONS}
                />
                <SelectField
                  label="Site Verified badge"
                  path={`tiers.${index}.limits.siteVerified`}
                  value={tier.limits.siteVerified}
                  onChange={update}
                  options={BADGE_OPTIONS}
                />
                <Toggle
                  label="Homepage banner"
                  path={`tiers.${index}.limits.homepageBanner`}
                  checked={tier.limits.homepageBanner}
                  onChange={update}
                />
                <Toggle
                  label="Dedicated account manager"
                  path={`tiers.${index}.limits.dedicatedAccountManager`}
                  checked={tier.limits.dedicatedAccountManager}
                  onChange={update}
                />
                <Toggle
                  label="Monthly lead report"
                  path={`tiers.${index}.limits.monthlyLeadReport`}
                  checked={tier.limits.monthlyLeadReport}
                  onChange={update}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Guarantees & trials"
          description="The lead guarantee is built but ships switched off until the six-month review."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Money-back (days)"
              path="guarantees.moneyBackDays"
              value={settings.guarantees.moneyBackDays}
              onChange={update}
              type="number"
              min={0}
              max={365}
            />
            <TextField
              label="Money-back applies to"
              path="guarantees.moneyBackAudience"
              value={settings.guarantees.moneyBackAudience}
              onChange={update}
            />
            <div className="sm:col-span-2">
              <Toggle
                label="Lead guarantee live"
                path="guarantees.leadGuaranteeEnabled"
                checked={settings.guarantees.leadGuaranteeEnabled}
                onChange={update}
                hint="Off at launch — enable after the six-month review."
              />
            </div>
            <TextField
              label="Guaranteed inquiries"
              path="guarantees.leadGuaranteeMinInquiries"
              value={settings.guarantees.leadGuaranteeMinInquiries}
              onChange={update}
              type="number"
              min={0}
            />
            <TextField
              label="Silver trial (months)"
              path="trials.silverTrialMonths"
              value={settings.trials.silverTrialMonths}
              onChange={update}
              type="number"
              min={0}
              max={24}
            />
            <div className="sm:col-span-2">
              <TextField
                label="Lead guarantee remedy"
                path="guarantees.leadGuaranteeNote"
                value={settings.guarantees.leadGuaranteeNote}
                onChange={update}
              />
            </div>
            <TextField
              label="Trial eligibility"
              path="trials.eligibleCountry"
              value={settings.trials.eligibleCountry}
              onChange={update}
              hint="Grants are made from Admin → Members."
            />
            <div className="sm:col-span-2">
              <TextField
                label="Trial note"
                path="trials.note"
                value={settings.trials.note}
                onChange={update}
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Buying mode note"
                path="buyingMode.note"
                value={settings.buyingMode.note}
                onChange={update}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Service fees (outside membership)"
          description="Charged separately from the membership plan. These prices appear on the membership, verification, sourcing and market-entry pages."
        >
          <div className="space-y-4">
            {fees.map((fee, index) => (
              <div key={fee.key} className="rounded-xl border border-slate-200 bg-surface p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Service"
                    path={`serviceFees.${index}.name`}
                    value={fee.name}
                    onChange={update}
                  />
                  {fee.kind === "fixed" ? (
                    <>
                      <TextField
                        label="Price USD"
                        path={`serviceFees.${index}.usd`}
                        value={fee.usd}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                      <TextField
                        label="Price BDT"
                        path={`serviceFees.${index}.bdt`}
                        value={fee.bdt}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                    </>
                  ) : null}
                  {fee.kind === "range_bdt" ? (
                    <>
                      <TextField
                        label="From BDT"
                        path={`serviceFees.${index}.bdtMin`}
                        value={fee.bdtMin}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                      <TextField
                        label="To BDT"
                        path={`serviceFees.${index}.bdtMax`}
                        value={fee.bdtMax}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                    </>
                  ) : null}
                  {fee.kind === "percent" ? (
                    <>
                      <TextField
                        label="From (%)"
                        path={`serviceFees.${index}.percentMin`}
                        value={fee.percentMin}
                        onChange={update}
                        type="number"
                        min={0}
                        max={100}
                      />
                      <TextField
                        label="To (%)"
                        path={`serviceFees.${index}.percentMax`}
                        value={fee.percentMax}
                        onChange={update}
                        type="number"
                        min={0}
                        max={100}
                      />
                      <TextField
                        label="Minimum fee USD"
                        path={`serviceFees.${index}.minFeeUsd`}
                        value={fee.minFeeUsd}
                        onChange={update}
                        type="number"
                        min={0}
                        hint="0 keeps the wording as “with a minimum fee”."
                      />
                    </>
                  ) : null}
                  {fee.kind === "retainer" ? (
                    <>
                      <TextField
                        label="Retainer from USD"
                        path={`serviceFees.${index}.retainerUsdMin`}
                        value={fee.retainerUsdMin}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                      <TextField
                        label="Retainer to USD"
                        path={`serviceFees.${index}.retainerUsdMax`}
                        value={fee.retainerUsdMax}
                        onChange={update}
                        type="number"
                        min={0}
                      />
                      <TextField
                        label="Sales from (%)"
                        path={`serviceFees.${index}.salesPercentMin`}
                        value={fee.salesPercentMin}
                        onChange={update}
                        type="number"
                        min={0}
                        max={100}
                      />
                      <TextField
                        label="Sales to (%)"
                        path={`serviceFees.${index}.salesPercentMax`}
                        value={fee.salesPercentMax}
                        onChange={update}
                        type="number"
                        min={0}
                        max={100}
                      />
                    </>
                  ) : null}
                  <div className="sm:col-span-2">
                    <TextField
                      label={fee.kind === "custom" ? "Pricing note" : "Note"}
                      path={`serviceFees.${index}.note`}
                      value={fee.note}
                      onChange={update}
                      hint={
                        fee.kind === "custom"
                          ? "Shown as the price — describe how it is quoted."
                          : "Appended to the published price."
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="font-display text-base font-bold text-primary">Publish settings</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            Saved server-side under Super Admin permission (console.pricing), diffed into
            the audit log, and pushed to every page that shows a price or limit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              setSettings(clone(initial));
              setResult(null);
            }}
          >
            Discard changes
          </Button>
          <Button type="submit" variant="navy" size="sm" disabled={pending}>
            {pending ? "Publishing…" : "Publish settings"}
          </Button>
        </div>
      </div>

      {result ? (
        <p
          className={`text-[13px] leading-6 ${result.ok ? "text-success" : "text-red-600"}`}
          role="status"
        >
          {result.ok
            ? result.changed.length
              ? `Published — ${result.changed.length} field(s) updated: ${result.changed
                  .slice(0, 6)
                  .join(", ")}${result.changed.length > 6 ? "…" : ""}`
              : "No changes to publish."
            : result.error}
        </p>
      ) : null}
    </form>
  );
}
