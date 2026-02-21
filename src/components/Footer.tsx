import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer-root">
      <div className="footer-grid">
        <div>
          <h3 className="footer-heading" style={{ fontSize: "var(--text-xl)", color: "var(--color-brand)" }}>
            UREMO
          </h3>
          <p className="footer-text" style={{ marginTop: "var(--space-3)" }}>
            Your marketplace for digital services, rentals, and work opportunities.
            Buy, earn, rent, or find deals — all in one platform.
          </p>
        </div>

        <div>
          <h4 className="footer-heading">Marketplace</h4>
          <div className="footer-links">
            <Link href="/explore" className="footer-link">Explore</Link>
            <Link href="/deals" className="footer-link">Deals</Link>
            <Link href="/rentals" className="footer-link">Rentals</Link>
            <Link href="/service-request" className="footer-link">Request a Service</Link>
          </div>
        </div>

        <div>
          <h4 className="footer-heading">Resources</h4>
          <div className="footer-links">
            <Link href="/blogs" className="footer-link">Blog</Link>
            <Link href="/workspace" className="footer-link">Work With Us</Link>
            <Link href="/support" className="footer-link">Support</Link>
          </div>
        </div>

        <div>
          <h4 className="footer-heading">Account</h4>
          <div className="footer-links">
            <Link href="/dashboard" className="footer-link">Dashboard</Link>
            <Link href="/wallet" className="footer-link">Wallet</Link>
            <Link href="/profile" className="footer-link">Profile</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span className="footer-copy">
          &copy; {new Date().getFullYear()} UREMO. All rights reserved.
        </span>
        <span className="footer-copy">Built with purpose.</span>
      </div>
    </footer>
  );
}
