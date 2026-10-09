"use client";

import { Button, Field, Input, Select, Textarea } from "./ui";

export default function ProfileForm({ user = {} }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" required>
          <Input name="company" placeholder="Your registered company name" required />
        </Field>
        <Field label="Trading name" hint="Shown to buyers">
          <Input name="trading" placeholder="Trading name" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary contact" required>
          <Input name="contact" defaultValue={user.name ?? ""} required />
        </Field>
        <Field label="Work email" required>
          <Input
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            placeholder="name@company.com"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <Input name="phone" placeholder="+880 …" />
        </Field>
        <Field label="Country" required>
          <Select name="country" defaultValue="">
            <option value="" disabled>
              Select a country
            </option>
            <option>Bangladesh</option>
            <option>Germany</option>
            <option>Netherlands</option>
            <option>United Arab Emirates</option>
            <option>United Kingdom</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Year established">
          <Input name="established" type="number" placeholder="YYYY" />
        </Field>
        <Field label="Main port">
          <Input name="port" placeholder="e.g. Chattogram" />
        </Field>
      </div>

      <Field label="Company overview" hint="Shown at the top of your supplier profile">
        <Textarea
          name="about"
          rows={5}
          placeholder="What you export, certifications, capacity and the markets you serve."
        />
      </Field>

      <Field label="Annual capacity">
        <Input name="capacity" placeholder="e.g. 6,000 MT" />
      </Field>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <Button type="submit" variant="navy">
          Save changes
        </Button>
        <Button variant="outline" type="button">
          Cancel
        </Button>
      </div>
    </form>
  );
}
