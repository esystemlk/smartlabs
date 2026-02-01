# 📺 How to Get Your YouTube API Key

Follow these steps to generate a generic **YouTube Data API v3** key so your website can automatically sync with your channel.

## Step 1: Create a Project in Google Cloud
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. Click the dropdown menu at the top left (next to "Google Cloud") and select **"New Project"**.
4. Name it something like `Smart Labs Website` and click **Create**.

## Step 2: Enable the YouTube Data API
1. On the left sidebar, go to **APIs & Services** > **Library**.
2. In the search bar, type `YouTube Data API v3`.
3. Click on the result **YouTube Data API v3**.
4. Click the blue **Enable** button.

## Step 3: Create Credentials (API Key)
1. After enabling, click **Create Credentials** on the right side (or go to **APIs & Services** > **Credentials** manually).
2. Click **+ Create Credentials** at the top and select **API Key**.
3. 🎉 Your API Key will be created! Copy this string (starts with `AIza...`).
4. (Optional but recommended) Click **Edit API Key** to restrict it to "YouTube Data API v3" to prevent misuse.

## Step 4: Get Your Channel ID
1. Go to your YouTube Channel page (e.g., `youtube.com/@SmartLabs`).
2. Right-click anywhere on the page and select **View Page Source**.
3. Press `Ctrl+F` (or Cmd+F) and search for `channelId`.
4. You will see something like `"channelId":"UCxxxxxxxxxxxxxxx"`. Copy the `UC...` part.
   - *Alternative*: Share your channel link -> the ID is often in the URL if it's the old format, or check your YouTube Studio settings > Channel.

## Step 5: Configure Your Website
1. Open the file `.env.local` in your project folder.
2. Add the following lines (replace with your actual values):

```env
# YouTube configuration
YOUTUBE_API_KEY=AIzaSyD... (Paste your key from Step 3 here)
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UC123456... (Paste your Channel ID from Step 4 here)
```

## Step 6: Restart Server
1. Stop your running server (Ctrl+C in terminal).
2. Run `npm run dev` again.
3. Visit `/videos` on your site. If "Live Sync Active" appears, it worked!
