# Supabase Storage Setup for Devotion Photos

## Quick Navigation

**Supabase Dashboard URL**: https://supabase.com/dashboard/project/ygruzmvptovywkcejtvm

Then click: **Storage** (left sidebar) → **New bucket** button

---

## Detailed Steps to Create Storage Bucket

### Step 1: Navigate to Storage
1. Go to https://supabase.com/dashboard/project/ygruzmvptovywkcejtvm
2. Look at the **left sidebar**
3. Find and click on **"Storage"** icon (looks like a folder 📁)
   - It's usually below "Database" and above "Edge Functions"
   - If you don't see it, scroll down the sidebar

### Step 2: Create New Bucket
1. Once you're in Storage section, click **"New bucket"** button (green button, top right)
2. A dialog will appear with these fields:
   - **Name**: Enter `devotion-photos` (exactly this name)
   - **Public bucket**: ✅ **CHECK THIS BOX** (very important!)
   - **File size limit**: Leave default or set to 50MB
   - **Allowed MIME types**: Leave empty (accepts all image types)

3. Click **"Create bucket"** button

### Step 3: Verify Bucket Created
- You should see `devotion-photos` in the buckets list
- It should show as "Public" status
- Click on it to open the bucket (it will be empty at first)

---

## Alternative: If "Storage" is not in sidebar

If you don't see Storage in the left sidebar:

1. Go to **Settings** (bottom of left sidebar, gear icon ⚙️)
2. Click on **API** section
3. Scroll down to **Storage API**
4. Make sure Storage is enabled
5. Go back to main dashboard and look for Storage again

---

## Direct Links (Try these)

1. **Storage Dashboard**: 
   ```
   https://supabase.com/dashboard/project/ygruzmvptovywkcejtvm/storage/buckets
   ```

2. **Create Bucket Page**:
   ```
   https://supabase.com/dashboard/project/ygruzmvptovywkcejtvm/storage/buckets/new
   ```

Just copy-paste these URLs in your browser! 🚀

---

## Steps to Create Storage Bucket

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project: `ygruzmvptovywkcejtvm`

2. **Create Storage Bucket**
   - Click on "Storage" in the left sidebar
   - Click "New bucket" button
   - Bucket name: `devotion-photos`
   - Make it **Public** (check the "Public bucket" checkbox)
   - Click "Create bucket"

3. **Set Bucket Policies (Optional but Recommended)**
   - Click on the `devotion-photos` bucket
   - Go to "Policies" tab
   - You can add policies to control who can upload/read files
   - For now, making it public allows anyone to read the files via URL

4. **Folder Structure**
   The app will automatically create folders:
   - `c2s/` - for Connect 2 Souls devotion photos
   - Files will be named: `{timestamp}-{random}.{extension}`
   - Example: `c2s/1726512345-abc123.jpg`

## How It Works

When a devotion record is submitted with a photo:

1. **Client Side (Browser)**
   - User uploads photo → converted to base64
   - Displayed as preview in the form

2. **Server Side (After Submit)**
   - `createC2SDevotionRecord` or `updateC2SDevotionRecord` is called
   - If photo is base64 (`data:image/...`), it's uploaded to Supabase Storage
   - Returns a public URL like: `https://ygruzmvptovywkcejtvm.supabase.co/storage/v1/object/public/devotion-photos/c2s/1726512345-abc123.jpg`
   - This URL is saved to the database in `photo_url` and `photo_urls` columns

3. **Display**
   - Frontend displays the photo using the public URL
   - Much faster than base64 strings
   - Reduced database size

## Benefits

✅ Efficient storage - images stored separately from database
✅ Fast loading - optimized image delivery via CDN
✅ Scalable - can store unlimited photos
✅ Easy to manage - view/delete photos in Supabase dashboard
✅ Backup friendly - separate from database backups

## Testing

After creating the bucket:

1. Submit a new devotion record with a photo
2. Check the database - should see a URL instead of base64
3. Check Supabase Storage - should see the uploaded file in `devotion-photos/c2s/`
4. Photo should display on the devotions list and detail modal

## Troubleshooting

If photos don't upload:
- Check Supabase credentials in `.env.local`
- Ensure bucket exists and is public
- Check server console for upload errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
