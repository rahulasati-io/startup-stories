This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Use Node.js **22.20.0 or newer within Node 22**. The tested version is pinned in
`.nvmrc` (22.23.5), and `package.json` declares the supported range for local and
deployment builds. With a Node version manager, select this version before
running `npm ci`. Existing terminals may need reopening after updating Node.

For the isolated Windows runtime used for local verification on this machine,
select it in the current PowerShell session only:

```powershell
$env:Path = "$env:LOCALAPPDATA\Programs\MisterStoryNode\node-v22.23.5-win-x64;$env:Path"
node --version
npm ci
```

This does not replace the system-wide Node installation or modify persistent
PATH settings. On another machine, install/select the version from `.nvmrc`
using the official Node.js distribution or your existing version manager.

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

### Targeted dependency maintenance

Next.js and `eslint-config-next` are pinned together. Sanity and Vision are also
pinned together to preserve the verified Studio image-editor integration.
The `smol-toml`-only override replaces an old TOML parser bundled by Sanity's CLI
tooling. Its other consumer already uses 1.9.1; no other package is overridden.
It does not change website content or dataset parsing. Keep the lockfile and run
the dependency-security regression test when updating these dependencies.
Do not use `npm audit fix --force` as a substitute
for testing a targeted upgrade.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
