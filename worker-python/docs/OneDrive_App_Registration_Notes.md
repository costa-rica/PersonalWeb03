# OneDrive App Registration Notes

## Azure HOme
- https://portal.azure.com/#home
- App Registrations
- Then register a new app
    - give it a name 
    - Who can use this application or access this API? Select "Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
    - Redirect URIs: select web and I put http://localhost:8000

## Credentials / Configuration of your app
From inside the home or overview page
- Application (client) ID
    - this goes in the .env file as APPLICATION_ID 
- Get the secret from "Client credentials" > create > use the value for the client secret, not secret ID
    - this goes in the .env file as CLIENT_SECRET
- I added permissions from the "API permissions" page > add a permission > Files.Read.All

## Running the script
Now you're ready to run.
- python src/get_auth_token.py
- a browser will open and you'll need to log in with your Microsoft account
- after logging in, you'll be redirected to http://localhost:8000
- [In the terminal] you'll see a success message and your refresh token
