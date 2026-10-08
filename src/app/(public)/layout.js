import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

export default function PublicLayout({ children }) {
  return (
    <>
      <SiteNavbar />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
