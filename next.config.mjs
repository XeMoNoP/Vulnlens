/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/admin_security.php', destination: '/vulnlens', permanent: false },
      { source: '/admin.php', destination: '/admin', permanent: false },
      { source: '/admin_login.php', destination: '/admin/login', permanent: false },
      { source: '/login.php', destination: '/login', permanent: false },
      { source: '/register.php', destination: '/register', permanent: false },
      { source: '/cart.php', destination: '/cart', permanent: false },
      { source: '/checkout.php', destination: '/checkout', permanent: false },
      { source: '/profile.php', destination: '/profile', permanent: false },
      { source: '/index.php', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
