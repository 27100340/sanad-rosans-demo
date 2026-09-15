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
      // `wasm-unsafe-eval` and the jsdelivr origin are for the on-device exam
      // proctor only: it dynamically imports MediaPipe and compiles its WASM in the
      // browser. Without both, proctoring works in dev (where `unsafe-eval` covers
      // it) and dies in the production build. The models themselves are fetched,
      // not executed as script, so they only need connect-src below.
      process.env.NODE_ENV === "production"
        ? "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "media-src 'self' blob: https://everyayah.com https://cdn.islamic.network https://verses.quran.com https://verses.quran.foundation https://download.quranicaudio.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' blob: https://everyayah.com https://cdn.islamic.network https://api.alquran.cloud https://api.quran.com https://verses.quran.foundation https://cdn.jsdelivr.net https://storage.googleapis.com",
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
          // `camera=()` is an EMPTY allowlist: it disables the camera for every
          // origin including our own, so getUserMedia is rejected outright and the
          // browser never prompts. That silently broke exam proctoring, which is a
          // first-party feature. `(self)` restores it to us only.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
