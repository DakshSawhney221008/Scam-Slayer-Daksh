# 🚀 Deployment Guide

## Quick Deploy to Railway (Recommended)

Railway is the easiest way to deploy this multiplayer quiz game:

### Step 1: Prepare Your Code

1. Make sure all files are saved
2. Initialize git if not already done:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose this repository
6. Railway will automatically:
    - Detect it's a Node.js project
    - Install dependencies (`npm install`)
    - Start the server (`npm start`)
    - Provide you with a live URL

### Step 3: Test Your Deployment

1. Visit the provided Railway URL
2. Open multiple browser tabs to test multiplayer functionality
3. Share the URL with friends to play together!

## Alternative Deployment Options

### Option 1: Render.com

1. Go to [render.com](https://render.com)
2. Connect your GitHub account
3. Create a new "Web Service"
4. Select this repository
5. Use these settings:
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`
    - **Environment:** Node

### Option 2: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-quiz-app-name`
4. Deploy: `git push heroku main`

### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in your project directory
3. Follow the prompts

## Environment Variables

All platforms should work with default settings. The app uses:

-   `PORT` environment variable (automatically set by hosting platforms)
-   Default port 3000 for local development

## Testing Your Deployment

1. **Single Player Test:**

    - Visit your deployed URL
    - Enter a nickname
    - Click "Host Game"
    - Start the quiz and answer questions

2. **Multiplayer Test:**
    - Open your deployed URL in multiple browser tabs/windows
    - Have one tab host the game
    - Have other tabs join with different nicknames
    - Test the real-time functionality

## Troubleshooting

### Common Issues:

1. **WebSocket Connection Issues:**

    - Make sure your hosting platform supports WebSocket connections
    - Railway, Render, and Heroku all support WebSockets

2. **App Not Starting:**

    - Check that `package.json` has the correct start script
    - Verify all dependencies are listed in `package.json`

3. **Static Files Not Loading:**
    - Ensure the `public` folder is included in your deployment
    - Check that Express is serving static files correctly

### Getting Help:

-   Check the hosting platform's logs for error messages
-   Test locally first with `npm start`
-   Ensure all files are committed to your repository

## Success! 🎉

Once deployed, your multiplayer quiz game will be live and accessible to anyone with the URL. Share it with friends and family to start playing together!
