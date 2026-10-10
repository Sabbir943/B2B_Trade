import { BankIcon } from "./icons";

function VisaMark() {
  return (
    <span className="text-[13px] font-black leading-none tracking-tight text-[#1A1F71] -skew-x-10">
      VISA
    </span>
  );
}

function MastercardMark() {
  return (
    <svg
      viewBox="0 0 28 18"
      className="h-4 w-[25px]"
      role="img"
      aria-label="Mastercard"
    >
      <circle cx="10" cy="9" r="7" fill="#EB001B" />
      <circle cx="18" cy="9" r="7" fill="#F79E1B" />
      <path
        d="M14 3.26a7 7 0 0 1 0 11.48 7 7 0 0 1 0-11.48Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function BkashMark() {
  return (
    <span className="text-[13px] font-black leading-none tracking-tight text-[#E2136E]">
      bKash
    </span>
  );
}

function NagadMark() {
  return (
    <span className="text-[13px] font-black leading-none tracking-tight text-[#EE7623]">
      Nagad
    </span>
  );
}

function SwiftMark() {
  return (
    <span className="inline-flex items-center gap-1 text-[#0A5486]">
      <BankIcon className="h-3.5 w-3.5" />
      <span className="text-[11px] font-black leading-none tracking-[0.08em]">
        SWIFT
      </span>
    </span>
  );
}

export const paymentMarks = [
  { label: "Visa", Mark: VisaMark },
  { label: "Mastercard", Mark: MastercardMark },
  { label: "bKash", Mark: BkashMark },
  { label: "Nagad", Mark: NagadMark },
  { label: "Bank Transfer (SWIFT)", Mark: SwiftMark },
];

export const PAYMENT_CHIP_CLASS =
  "inline-flex h-7 items-center justify-center rounded-md bg-white px-2.5 shadow-sm ring-1 ring-black/5";
