# Deploy to Cloudflare Pages

This is a static HTML, CSS, and JavaScript portfolio. It has no server, framework, package manager, database, or required environment variables. Three.js and its license are bundled in `vendor/`; Google Fonts loads externally with system-font fallbacks. Cloudflare Pages can host it without a Worker or paid services.

## Build locally

Install Node.js, then run `node build.mjs` from the repository root. The script copies only the public files into `dist/` and uses root-relative asset URLs in the output. Serve `dist/` with a local static server to check the production files. The source `index.html` can still be opened directly for development.

The build does not delete existing files from `dist/`. Use a fresh output directory if you have manually added files there. Cloudflare Git builds start from a fresh checkout.

Cloudflare Pages serves the root page for unmatched paths when there is no `404.html`. This portfolio uses one page and fragment navigation, not separate client-side routes. Nested URLs such as `/example/path` therefore show the same portfolio, and the built asset URLs resolve from the site root. A future `404.html` would change this fallback behavior.

## Connect GitHub

1. Create a GitHub repository and push the project files, including `build.mjs`, `.env.example`, and `vendor/`, to the branch you want to deploy. This checkout currently has no Git metadata, so initialize and connect a repository first if needed. Do not commit `.env` files or secrets.
2. In the Cloudflare dashboard, open **Workers & Pages**, select **Create application**, then select **Pages** and **Connect to Git** or **Import an existing Git repository**.
3. Authorize Cloudflare's GitHub integration, select your repository, and begin setup.
4. Choose a project name and select your actual production branch, such as `main`. Cloudflare deploys commits on that branch to production; other branches can create preview deployments.
5. Select **None** as the framework preset. Leave the root directory at the repository root. Set **Build command** to `node build.mjs` and **Build output directory** to `dist`.
6. Leave environment variables empty. If a future build needs variables, set them under the Pages project **Settings > Environment variables**, separately for production and preview. Never place secrets in HTML or browser JavaScript because those files are public. Use server-side bindings or secrets for any future backend features.
7. Review the settings, then choose **Save and Deploy** when you are ready to publish. Cloudflare will build the selected commit and provide a `pages.dev` address. Future pushes to the production branch trigger deployments automatically.

## Custom domain and verification

1. In the Pages project, open **Custom domains** and select **Set up a custom domain**. Enter the domain or subdomain and follow the dashboard instructions before adding DNS records.
2. For an apex domain such as `example.com`, add the domain as a Cloudflare zone and point its nameservers to Cloudflare as instructed. For a subdomain such as `www.example.com`, Cloudflare can direct you to add a CNAME pointing to your project's `pages.dev` hostname at your DNS provider. Wait for DNS and certificate activation.
3. Open the `pages.dev` address and then the custom domain over HTTPS. Check the navigation, project links, mobile menu, and background animation. Open and refresh a nested URL such as `/example/path`, then confirm that the page and its CSS and JavaScript load. Check the browser console and network panel for errors. Test reduced motion and a narrow viewport.

The free plan supports static Pages hosting subject to Cloudflare's current limits. Review the dashboard limits before enabling optional services.

References: [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/), and [Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/).
