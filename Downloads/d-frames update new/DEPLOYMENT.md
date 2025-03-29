# D-Frames Deployment Guide

This guide explains how to deploy the D-Frames application, including both the main website and the employee portal, as a single deployment under the same domain.

## Prerequisites

- A GitHub account
- A Vercel account (or another hosting provider like Netlify, AWS, etc.)
- Your Supabase project set up and configured

## Environment Variables

Before deploying, make sure to set up the following environment variables in your hosting platform:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_test_key
```

**IMPORTANT**: Always use Stripe test keys (`pk_test_`) during development and testing. Only use live keys (`pk_live_`) in production, and always store them as environment variables, never in your code.

## Deployment Steps

### Using Vercel (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com/) and sign in
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

3. **Set Environment Variables**:
   - In the Vercel project settings, add the environment variables listed above

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

### Using Netlify

1. **Push your code to GitHub** (same as above)

2. **Connect to Netlify**:
   - Go to [Netlify](https://netlify.com/) and sign in
   - Click "New site from Git"
   - Choose your GitHub repository
   - Configure the build settings:
     - Build Command: `npm run build`
     - Publish Directory: `build`

3. **Set Environment Variables**:
   - In the Netlify site settings, add the environment variables

4. **Configure Redirects**:
   - Create a `_redirects` file in the `public` folder with:
     ```
     /*    /index.html   200
     ```

5. **Deploy**:
   - Click "Deploy site"

## Accessing Your Deployed Application

After deployment, your application will be available at:

- Main website: `https://your-domain.com/`
- Employee portal: `https://your-domain.com/employee-portal/`
- Admin area: `https://your-domain.com/admin/`

## Security Considerations

1. **Authentication**:
   - The employee portal is protected by Supabase authentication
   - Make sure to create employee accounts in Supabase Auth

2. **API Keys**:
   - All API keys are stored as environment variables
   - The Stripe public key is the only key exposed to the client, which is safe

3. **Route Protection**:
   - All employee portal routes check for valid authentication
   - Unauthorized users are redirected to the login page

## Troubleshooting

If you encounter issues with routing after deployment:

1. **404 Errors**: Make sure your hosting provider is configured to redirect all routes to `index.html` for client-side routing to work.

2. **Authentication Issues**: Check that your Supabase environment variables are correctly set.

3. **API Connection Problems**: Ensure CORS is properly configured in your Supabase project.

## Custom Domain Setup

To use a custom domain:

1. Purchase a domain from a domain registrar (e.g., Namecheap, GoDaddy)
2. In your hosting platform (Vercel/Netlify), add your custom domain
3. Update your DNS records at your domain registrar to point to your hosting provider

## Monitoring and Analytics

Consider setting up:

1. **Error Monitoring**: Sentry or LogRocket
2. **Analytics**: Google Analytics or Plausible
3. **Performance Monitoring**: Vercel Analytics or Netlify Analytics
