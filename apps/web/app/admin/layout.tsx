import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header card">
        <Link href="/admin/products" className="brand brand-link">
          <img src="/images/GuruLogo.png" alt="Guru logo" className="brand-logo" />
          <span>Guru Game Admin</span>
        </Link>
        <Link href="/zh" className="button">
          Public Site
        </Link>
      </header>
      {children}
    </div>
  );
}
