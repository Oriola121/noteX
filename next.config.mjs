import withSvgr from 'next-svgr';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "",
        port: "",
        pathname: "/**",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    if (!isServer) {
      config.resolve.alias.canvas = false;
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Add PDF file loader
    config.module.rules.push({
      test: /\.pdf$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      ],
    });

    // Resolve pdfjs-dist worker
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] = 'pdfjs-dist/legacy/build/pdf.worker.entry.mjs';

    // Existing PDF worker rule
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?mjs/,
      use: "file-loader",
    });

    // Alias and fallback for PDF-related packages
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
    };

    // Support .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },

  // Increase file upload size limit
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Length',
            value: '50mb',
          },
        ],
      },
    ];
  },

  transpilePackages: ['react-pdf', 'pdfjs-dist'],
};

// Export the configuration with SVGR support
export default withSvgr(nextConfig);
