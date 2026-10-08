"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { CheckIcon } from "./icons";

export default function ApplyForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-bold text-emerald-800">
          Application received
        </p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          Reference <span className="font-semibold">ME-119</span>. A market
          entry officer will contact you within two working days to schedule a
          scoping call.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setDone(false)}>
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setDone(true);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company / brand" required>
          <Input name="company" placeholder="Legal entity name" required />
        </Field>
        <Field label="Website" hint="Optional">
          <Input name="website" placeholder="https://" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <Select name="category" defaultValue="" required>
            <option value="" disabled>
              Select a category
            </option>
            <option>Spices &amp; Seasonings</option>
            <option>Agro Products</option>
            <option>Textile &amp; Garment Accessories</option>
            <option>Leather &amp; Footwear</option>
            <option>Jute &amp; Jute Products</option>
            <option>Chemicals</option>
            <option>Other</option>
          </Select>
        </Field>
        <Field label="Target market" required>
          <Select name="market" defaultValue="" required>
            <option value="" disabled>
              Where will you sell?
            </option>
            <option>European Union</option>
            <option>United Kingdom</option>
            <option>North America</option>
            <option>GCC</option>
            <option>Asia-Pacific</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" required>
          <Input name="name" placeholder="Full name" required />
        </Field>
        <Field label="Work email" required>
          <Input name="email" type="email" placeholder="name@company.com" required />
        </Field>
      </div>

      <Field label="What are you looking to source or launch?" required>
        <Textarea
          name="details"
          rows={5}
          placeholder="Products, approximate annual volume, timeline, certifications you require…"
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="navy">
          Submit application
        </Button>
        <p className="text-[12px] text-slate-500">
          No fee to apply — fees only start when an engagement is agreed.
        </p>
      </div>
    </form>
  );
}
