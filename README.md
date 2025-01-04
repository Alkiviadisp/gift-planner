# Gift Planner

A web application for planning and organizing gifts for all your special occasions. Built with Next.js, Supabase, and modern UI frameworks.

## Features

- User authentication
- Gift categories for different occasions
- Group gift planning with contribution tracking
- Calendar integration (Google Calendar & Apple Calendar)
- Modern, responsive UI with dark mode support

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase (Authentication & Database)
- Tailwind CSS
- Shadcn UI Components
- Google Calendar API
- Apple Calendar Integration

## Getting Started

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/gift-planner.git
cd gift-planner
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase and Calendar API credentials

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
/gift-planner
├── /src
│   ├── /app             # Next.js 14 App Router pages
│   ├── /components      # Reusable React components
│   ├── /lib            # Utility functions and configurations
│   ├── /types          # TypeScript type definitions
│   └── /hooks          # Custom React hooks
├── /public             # Static assets
└── /prisma            # Database schema and migrations
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 