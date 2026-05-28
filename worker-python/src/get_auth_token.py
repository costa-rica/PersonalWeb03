"""
One-time authentication script to obtain a refresh token for OneDrive access.
Run this script once, complete the browser login, and save the refresh token to .env
"""

import os
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv
from msal import ConfidentialClientApplication

# Load environment variables
load_dotenv()

APPLICATION_ID = os.getenv('APPLICATION_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:8000'

# Microsoft Graph scopes for personal accounts
# Note: 'offline_access' is automatically handled by MSAL and should not be included
SCOPES = ['Files.Read', 'Files.Read.All']

# Global variable to store the authorization code
auth_code = None


class CallbackHandler(BaseHTTPRequestHandler):
    """HTTP server handler to capture the OAuth callback"""

    def do_GET(self):
        global auth_code

        # Parse the callback URL
        query_components = parse_qs(urlparse(self.path).query)

        if 'code' in query_components:
            auth_code = query_components['code'][0]

            # Send success response to browser
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'''
                <html>
                <body>
                    <h1>Authentication Successful!</h1>
                    <p>You can close this window and return to the terminal.</p>
                </body>
                </html>
            ''')
        else:
            # Send error response
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            error = query_components.get('error', ['Unknown error'])[0]
            error_desc = query_components.get('error_description', [''])[0]
            self.wfile.write(f'''
                <html>
                <body>
                    <h1>Authentication Failed</h1>
                    <p>Error: {error}</p>
                    <p>{error_desc}</p>
                </body>
                </html>
            '''.encode())

    def log_message(self, format, *args):
        """Suppress server log messages"""
        pass


def get_refresh_token():
    """
    Initiates the OAuth flow to get a refresh token.
    Opens browser for user authentication.
    """
    global auth_code

    # Create MSAL confidential client application (uses CLIENT_SECRET)
    # For personal accounts, use the consumers authority
    app = ConfidentialClientApplication(
        APPLICATION_ID,
        client_credential=CLIENT_SECRET,
        authority='https://login.microsoftonline.com/consumers'
    )

    # Generate authorization URL
    auth_url = app.get_authorization_request_url(
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )

    print("=" * 70)
    print("ONEDRIVE AUTHENTICATION")
    print("=" * 70)
    print("\nOpening browser for authentication...")
    print(f"If the browser doesn't open automatically, visit this URL:\n{auth_url}\n")

    # Open browser for user authentication
    webbrowser.open(auth_url)

    # Start local server to receive callback
    print("Starting local server on http://localhost:8000...")
    print("Waiting for authentication callback...\n")

    server = HTTPServer(('localhost', 8000), CallbackHandler)

    # Handle one request (the OAuth callback)
    server.handle_request()
    server.server_close()

    if not auth_code:
        print("ERROR: Failed to receive authorization code")
        return None

    print("Authorization code received!")
    print("Exchanging code for tokens...\n")

    # Exchange authorization code for tokens
    try:
        result = app.acquire_token_by_authorization_code(
            code=auth_code,
            scopes=SCOPES,
            redirect_uri=REDIRECT_URI
        )

        if 'refresh_token' in result:
            refresh_token = result['refresh_token']
            access_token = result['access_token']

            print("=" * 70)
            print("SUCCESS! Tokens obtained.")
            print("=" * 70)
            print("\nYour refresh token (add this to your .env file):")
            print("-" * 70)
            print(f"REFRESH_TOKEN={refresh_token}")
            print("-" * 70)
            print("\nInstructions:")
            print("1. Copy the line above")
            print("2. Add it to your .env file")
            print("3. Run app.py to download files automatically")
            print("\nNote: Keep this token secure! It provides access to your OneDrive.")
            print("=" * 70)

            return refresh_token
        else:
            print("ERROR: No refresh token in response")
            print(f"Response: {result}")
            return None

    except Exception as e:
        print(f"ERROR: Failed to exchange code for tokens: {e}")
        return None


if __name__ == '__main__':
    if not APPLICATION_ID:
        print("ERROR: APPLICATION_ID not found in .env file")
        exit(1)

    refresh_token = get_refresh_token()

    if not refresh_token:
        print("\nAuthentication failed. Please try again.")
        exit(1)
