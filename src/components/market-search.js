import { ChevronDownIcon, SearchIcon } from "./icons";

const searchTypes = [
  { value: "products", label: "Products" },
  { value: "suppliers", label: "Suppliers" },
  { value: "requirements", label: "Buy Requirements" },
];

export default function MarketSearch({ id, size = "md", className = "" }) {
  const large = size === "lg";

  return (
    <form
      action="/search"
      method="get"
      className={`flex items-stretch overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25 ${className}`}
    >
      <label htmlFor={id} className="sr-only">
        Search the marketplace
      </label>

      <div className="relative hidden shrink-0 items-center border-r border-slate-200 bg-slate-50 sm:flex">
        <select
          name="type"
          aria-label="Search within"
          defaultValue="products"
          className={`h-full appearance-none bg-transparent pl-3.5 pr-8 text-[13px] font-medium text-ink outline-none ${
            large ? "py-4" : "py-3"
          }`}
        >
          {searchTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-400" />
      </div>

      <span
        className={`pointer-events-none flex items-center text-slate-400 ${
          large ? "pl-4" : "pl-3"
        }`}
      >
        <SearchIcon className={large ? "h-5 w-5" : "h-4 w-4"} />
      </span>

      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search products, suppliers or buying requests"
        className={`min-w-0 flex-1 bg-transparent px-3 text-ink placeholder:text-slate-400 focus:outline-none ${
          large ? "py-4 text-[15px]" : "py-3 text-sm"
        }`}
      />

      <button
        type="submit"
        className={`m-1 shrink-0 rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          large ? "px-7" : "px-5"
        }`}
      >
        Search
      </button>
    </form>
  );
}
