# Next.js Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Libraries and Tools Used

- [shadcn/ui](https://ui.shadcn.com/) - For UI components.
- [react-pdf](https://react-pdf.org/) - For generating and displaying PDFs.
- [pdf-lib](https://pdf-lib.js.org/) - For manipulating PDFs programmatically.
- [sonner](https://sonner.dev/) - For toast notifications.
- [lucide-react](https://lucide.dev/) - For icons.

## Challenges Faced and Solutions

1. **PDF Manipulation:** Generating and manipulating PDFs dynamically was a challenge. Using `react-pdf` for rendering and `pdf-lib` for modifications helped solve this.
2. **UI Customization:** Integrating `shadcn/ui` for a modern and customizable UI required some initial learning but provided a great developer experience.
3. **Notifications Handling:** Implementing a toast notification system was necessary for better UX. `sonner` made it simple and effective.
4. **Responsive Design with PDFs:** Making the app responsive when a PDF is uploaded was challenging. The PDF rendering does not scale well on smaller screens, and adjustments are needed to improve the user experience on different devices.

## Potential Future Enhancements

- Implement advanced PDF editing features such as annotations.
- Add more UI customizations and themes.
- Optimize performance for large PDF processing tasks.

## Submission Guidelines

1. Fork this repository.
2. Implement your solution.
3. Update the README with:
   - Setup and running instructions.
   - Libraries or tools used and why.
   - Challenges faced and solutions.
   - Features to add if more time was available.
4. Submit a pull request or send us a link to your repository.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
