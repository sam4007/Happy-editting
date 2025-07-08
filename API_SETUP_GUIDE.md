# YouTube API Key Setup Guide

This guide will help you get your YouTube Data API key to enable real playlist imports.

## 🔑 Step-by-Step API Key Setup

### 1. Access Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Sign in with your Google account

### 2. Create or Select a Project
- Click the project dropdown at the top of the page
- Either select an existing project or create a new one:
  - Click "NEW PROJECT"
  - Enter a project name (e.g., "Happy Editing YouTube")
  - Click "CREATE"

### 3. Enable YouTube Data API v3
- In the Google Cloud Console, navigate to **APIs & Services** > **Library**
- Search for "YouTube Data API v3"
- Click on the **YouTube Data API v3** result
- Click **ENABLE** button

### 4. Create API Credentials
- Go to **APIs & Services** > **Credentials**
- Click **+ CREATE CREDENTIALS**
- Select **API Key**
- Your API key will be generated and displayed

### 5. Secure Your API Key (Recommended)
- Click on your newly created API key to edit it
- Under **API restrictions**, select **Restrict key**
- Choose **YouTube Data API v3** from the list
- Click **SAVE**

### 6. Configure Your Application
- Copy your API key
- Create a `.env` file in your project root
- Add your API key:
  ```
  YOUTUBE_API_KEY=your_api_key_here
  ```

## 🔒 Security Best Practices

### API Key Security
- **Never commit** your API key to version control
- **Never share** your API key publicly
- **Use environment variables** to store the key
- **Regularly rotate** your API keys

### Application Restrictions (Optional)
If you want extra security, you can restrict your API key to specific applications:
- Go to **APIs & Services** > **Credentials**
- Click on your API key
- Under **Application restrictions**, select **HTTP referrers**
- Add `http://localhost:3000/*` and `http://localhost:5000/*`

## 📊 Understanding API Quotas

### Default Quotas
- **Daily quota**: 10,000 units per day
- **Per-minute quota**: 100 requests per minute
- **Concurrent requests**: 100 requests per second

### Quota Consumption
Different API operations consume different amounts of quota:
- **List playlists**: 1 unit per request
- **List playlist items**: 1 unit per request
- **Get video details**: 1 unit per video (up to 50 videos per request)

### Example Quota Usage
Importing a 100-video playlist typically uses:
- 1 unit for playlist info
- 2 units for playlist items (2 requests for 100 videos)
- 2 units for video details (2 requests for 100 videos)
- **Total**: ~5 units per 100-video playlist

## 🚨 Troubleshooting

### Common Issues

#### API Key Not Working
1. **Check if API is enabled**: Ensure YouTube Data API v3 is enabled in your project
2. **Verify key format**: API keys should be 35-45 characters long
3. **Check restrictions**: Make sure your API key isn't overly restricted
4. **Billing account**: Some Google Cloud projects require a billing account

#### Quota Exceeded
1. **Check usage**: Go to **APIs & Services** > **Dashboard** to see quota usage
2. **Wait for reset**: Quotas reset at midnight Pacific Time
3. **Request increase**: You can request quota increases in the Google Cloud Console

#### Access Denied
1. **Public playlists**: Ensure the playlist is public or unlisted
2. **API restrictions**: Check if your API key has proper restrictions
3. **Project permissions**: Verify you have proper permissions in the Google Cloud project

## 💰 Pricing Information

### Free Tier
- **10,000 units per day** - FREE
- This is typically enough for:
  - 2,000 playlist imports per day
  - 500,000 video detail requests per day

### Paid Usage
- **$0.30 per 1,000 units** beyond the free tier
- Most users will never exceed the free tier
- Set up billing alerts to monitor usage

## 🔧 Testing Your Setup

Once you have your API key configured:

1. **Start the servers**:
   ```bash
   npm run server  # Backend
   npm start       # Frontend
   ```

2. **Check API health**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"OK","hasApiKey":true,...}`

3. **Test with a playlist**:
   - Open the app at http://localhost:3000
   - Click the "+" button and select "YouTube Playlist"
   - Try importing a public playlist

## 📚 Additional Resources

- [YouTube Data API v3 Documentation](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Quota Management](https://developers.google.com/youtube/v3/getting-started#quota)

## ⚡ Quick Start Commands

```bash
# 1. Get your API key from Google Cloud Console
# 2. Create .env file
echo "YOUTUBE_API_KEY=your_api_key_here" > .env

# 3. Start both servers
npm run server &
npm start

# 4. Test the integration
curl http://localhost:5000/api/health
```

---

**Need help?** Check the main README.md for troubleshooting or create an issue in the repository. 