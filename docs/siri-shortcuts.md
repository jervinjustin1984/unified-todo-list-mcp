# Siri + Apple Shortcuts

Add todos by voice using a Shortcut that calls the REST API with a personal API key.

## Prerequisites

1. Run migration [`supabase/migrations/20250519120000_user_api_keys.sql`](../supabase/migrations/20250519120000_user_api_keys.sql) in Supabase.
2. Sign in to the web app and open **API keys** (link on the Todos page).
3. Create a key named e.g. `Siri` and copy the full `utl_…` secret.

## Build the Shortcut

1. Open the **Shortcuts** app → **+** → name it e.g. **Add Todo**.
2. Add **Ask for Input** (or **Dictate Text**) → set variable `todoName`.
3. Add **Get Contents of URL**:
   - **URL:** `https://unified-todo-list-mcp.vercel.app/api/todos` (or your deployment URL)
   - **Method:** POST
   - **Headers:**
     - `Authorization`: `Bearer YOUR_utl_KEY` (paste your key)
     - `Content-Type`: `application/json`
   - **Request Body:** JSON

```json
{
  "name": "todoName",
  "source": "Siri via Shortcuts"
}
```

   In Shortcuts, tap the `todoName` placeholder in the JSON and select the **Ask for Input** variable.

4. Optional: **Show Notification** with the response or a success message.
5. Shortcut settings → **Add to Siri** → record a phrase (e.g. “Add todo”).

## Test

Run the Shortcut from the app or say your Siri phrase. The new todo should appear on the web Todos page for your account.

## Revoke

If a device is lost, open **API keys** on the web and **Revoke** that key. Create a new key and update the Shortcut header.

## Security notes

- v1 stores API key secrets in the database and lists them in Settings (convenient, not ideal for production).
- Never put your Supabase **service role** or **anon** key in a Shortcut—only `utl_…` personal keys.
