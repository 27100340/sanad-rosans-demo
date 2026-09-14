/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  agentRules: false,
  turbopack: { root: import.meta.dirname },
  poweredByHeader: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    // Same posture as the reference project. Quran audio streams from the public
    // per-ayah mirrors listed in general-spec/06-hifz-engine.md; Gemini is only
    // ever called server-side, so it does not appear in connect-src.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      // React dev mode needs eval for source-mapped stacks; production never does.
      process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: https://everyayah.com https://cdn.islamic.network https://verses.quran.com https://verses.quran.foundation https://download.quranicaudio.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' blob: https://everyayah.com https://cdn.islamic.network https://api.alquran.cloud https://api.quran.com https://verses.quran.foundation",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join("; ");
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
