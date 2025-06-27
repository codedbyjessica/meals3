# Recipe Import Instructions

This guide will help you import your recipe data from the JSON file into your Supabase database.

## Prerequisites

1. Make sure you have your Supabase environment variables set up in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Ensure your Supabase database has the `recipe` table created with the correct schema.

## Method 1: Using Node.js Script (Recommended)

### Step 1: Install dependencies
```bash
npm install dotenv
```

### Step 2: Get your Service Role Key
1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Run the import script
```bash
node import-all-recipes.js
```

This script will:
- Read all recipes from `data-export-recipes.json`
- Transform them to match your Supabase schema
- Insert them in batches of 25 recipes
- Provide detailed progress and error reporting
- Show a summary of successful and failed imports

## Method 2: Using SQL Script (Simple)

### Step 1: Get your User ID
1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Copy your user ID (UUID)
4. Or run this SQL query: `SELECT auth.uid() FROM auth.users LIMIT 1;`

### Step 2: Update the SQL script
1. Open `import-recipes-simple.sql`
2. Replace the `target_user_id` value with your actual user ID
3. Add more recipes to the VALUES section as needed

### Step 3: Run the SQL
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Paste the SQL script and run it

## Method 3: Manual SQL Import (For all recipes)

If you want to import all recipes via SQL, you can use the `import-recipes.sql` file, but it's quite large. The Node.js script is recommended for the full dataset.

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure all required environment variables are set in `.env.local`
   - Double-check the service role key is correct

2. **Permission errors**
   - Make sure you're using the service role key, not the anon key
   - Verify your RLS policies allow the operation

3. **Data type errors**
   - The script handles most data transformations automatically
   - Check that your recipe table schema matches the expected format

4. **Rate limiting**
   - The Node.js script includes delays between batches
   - If you encounter rate limits, increase the delay or reduce batch size

### Getting Help

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your Supabase project settings
3. Ensure your database schema is correct
4. Check that your user ID is valid

## Data Mapping

The import scripts map your JSON data to the Supabase schema as follows:

| JSON Field | Supabase Column | Notes |
|------------|----------------|-------|
| `user` | `user_id` | UUID of the recipe owner |
| `name` | `name` | Recipe name |
| `ingredients` | `ingredients` | Array of ingredient strings |
| `aromatics` | `aromatics` | Array of aromatic ingredient strings |
| `condiments` | `condiments` | Array of condiment strings |
| `time` | `time` | Cooking time as string |
| `instructions` | `instructions` | Cooking instructions |
| `tags` | `tags` | Array of tag strings |
| `dateCreated` | `created_at` | Creation timestamp |
| `dateModified` | `updated_at` | Last modification timestamp |

## Verification

After importing, you can verify the data by:

1. Checking your Supabase dashboard > Table Editor > recipe
2. Running a query: `SELECT COUNT(*) FROM recipe WHERE user_id = 'your_user_id';`
3. Testing the recipes page in your application

## Cleanup

After successful import, you can optionally remove the import files:
```bash
rm import-all-recipes.js import-recipes.js import-recipes.sql import-recipes-simple.sql
``` 