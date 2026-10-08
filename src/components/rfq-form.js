"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { CheckIcon } from "./icons";
import { categories } from "@/lib/catalog";

export default function RfqForm() {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-display text-lg font-bold text-emerald-800">
          Requirement published
        </p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          Reference <span className="font-semibold">RQ-4821</span>. Verified
          suppliers will start responding — replies land in your dashboard
          inbox.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/requirements" variant="outline" size="sm">
            View requirements
          </Button>
          <Button variant="navy" size="sm" onClick={() => setDone(false)}>
            Post another
          </Button>
        </div>
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
        <Field label="Product / material" required>
          <Input name="product" placeholder="e.g. Steam sterilised white pepper" required />
        </Field>
        <Field label="Category" required>
          <Select name="category" defaultValue="" required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Quantity" required>
          <Input name="quantity" placeholder="e.g. 20,000" required />
        </Field>
        <Field label="Unit" required>
          <Select name="unit" defaultValue="kg" required>
            <option value="kg">kg</option>
            <option value="MT">MT</option>
            <option value="pcs">pcs</option>
            <option value="rolls">rolls</option>
            <option value="FCL">FCL</option>
          </Select>
        </Field>
        <Field label="Target date" required>
          <Input name="date" type="date" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination market" required>
          <Input name="destination" placeholder="e.g. Rotterdam, NL" required />
        </Field>
        <Field label="Incoterm">
          <Select name="incoterm" defaultValue="FOB">
            <option>EXW</option>
            <option>FCA</option>
            <option>FOB</option>
            <option>CIF</option>
            <option>DDP</option>
          </Select>
        </Field>
      </div>

      <Field label="Specifications & requirements" required>
        <Textarea
          name="details"
          rows={5}
          placeholder="Grades, packing, certifications, inspection expectations, payment terms…"
          required
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent">
          Post Your Requirement
        </Button>
        <p className="text-[12px] text-slate-500">
          Free to post · your contact details stay hidden until you reply.
        </p>
      </div>
    </form>
  );
}
