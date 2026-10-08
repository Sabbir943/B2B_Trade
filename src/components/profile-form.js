"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { dashboard } from "@/lib/catalog";

export default function ProfileForm() {
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" required>
          <Input name="company" defaultValue={dashboard.user.company} required />
        </Field>
        <Field label="Trading name" hint="Shown to buyers">
          <Input name="trading" defaultValue="Meridian Spice" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary contact" required>
          <Input name="contact" defaultValue={dashboard.user.name} required />
        </Field>
        <Field label="Role">
          <Input name="role" defaultValue={dashboard.user.role} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Work email" required>
          <Input name="email" type="email" defaultValue="nadia@meridianspice.com" required />
        </Field>
        <Field label="Phone">
          <Input name="phone" defaultValue="+880 17 0000 0000" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" required>
          <Select name="country" defaultValue="Bangladesh">
            <option>Bangladesh</option>
            <option>Germany</option>
            <option>Netherlands</option>
            <option>United Arab Emirates</option>
            <option>United Kingdom</option>
          </Select>
        </Field>
        <Field label="Year established">
          <Input name="established" type="number" defaultValue={2009} />
        </Field>
      </div>

      <Field label="Company overview" hint="Shown at the top of your supplier profile">
        <Textarea
          name="about"
          rows={5}
          defaultValue="Exporter of steam-sterilised spices and basmati rice with EU-compliant documentation, lot-wise lab reports and 24-month shelf-life guarantees. Two processing units in Dinajpur and Chattogram port consolidation."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Annual capacity">
          <Input name="capacity" defaultValue="6,000 MT" />
        </Field>
        <Field label="Main port">
          <Input name="port" defaultValue="Chattogram" />
        </Field>
        <Field label="Team seats used">
          <Input name="seats" defaultValue="5 of 10" readOnly />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <Button type="submit" variant="navy">
          Save changes
        </Button>
        <Button variant="outline" type="button">
          Cancel
        </Button>
        {saved ? (
          <span className="text-[13px] font-semibold text-success">
            Profile saved — changes are live.
          </span>
        ) : null}
      </div>
    </form>
  );
}
